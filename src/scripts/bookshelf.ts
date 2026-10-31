import * as THREE from 'three'

type Book = {
	id: string
	title: string
	author: string
	isbn: string
	cover: string | null
	status: string
	addedAt: string | null
	rating: number | null
	finishedAt: string | null
	palette: string
}

class BookshelfScene {
	private container: HTMLElement
	private books: Book[]
	private onSelect: (book: Book) => void
	private renderer: THREE.WebGLRenderer
	private scene = new THREE.Scene()
	private camera: THREE.PerspectiveCamera
	private bookGroup = new THREE.Group()
	private bookMeshes: THREE.Mesh[] = []
	private raycaster = new THREE.Raycaster()
	private pointer = new THREE.Vector2(2, 2)
	private focusIndex: number
	private selectedIndex: number | null = null
	private hoveredIndex: number | null = null
	private cameraXTarget = 0
	private dragStartX = 0
	private dragStartY = 0
	private dragDistanceX = 0
	private dragDistanceY = 0
	private wheelDistanceX = 0
	private wheelDistanceY = 0
	private wheelEndTimer: number | undefined
	private dragging = false
	private lastFrameTime = performance.now()
	private canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches

	constructor(container: HTMLElement, books: Book[], onSelect: (book: Book) => void) {
		this.container = container
		this.books = books
		this.onSelect = onSelect
		this.focusIndex = Math.floor(books.length / 2)
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.35 : 1.8))
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.outputColorSpace = THREE.SRGBColorSpace
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping
		this.renderer.toneMappingExposure = 1.08
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = THREE.PCFShadowMap
		this.container.appendChild(this.renderer.domElement)

		this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
		this.camera.position.set(0, 0, window.innerWidth < 720 ? 10.5 : 12.5)
		this.scene.fog = new THREE.FogExp2(0xeeeae1, 0.035)
		this.scene.add(this.bookGroup)

		this.scene.add(new THREE.AmbientLight(0xfff6e6, 2))
		const warmLight = new THREE.DirectionalLight(0xffb497, 4.8)
		warmLight.position.set(5, 7, 9)
		warmLight.castShadow = true
		warmLight.shadow.mapSize.set(1024, 1024)
		this.scene.add(warmLight)
		const coolLight = new THREE.PointLight(0x6e9fcc, 22, 24)
		coolLight.position.set(-6, -3, 4)
		this.scene.add(coolLight)

		const floorMaterial = new THREE.MeshStandardMaterial({
			color: 0xe8e4dc,
			roughness: 0.92,
		})
		const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 18), floorMaterial)
		floor.position.set(0, -1.52, -0.25)
		floor.rotation.x = -Math.PI / 2
		floor.receiveShadow = true
		this.scene.add(floor)

		this.addBooks()
		this.updateFocusTarget()
		this.bindEvents()
		this.animate()
	}

	private coverTexture(book: Book, index: number) {
		const canvas = document.createElement('canvas')
		canvas.width = 512
		canvas.height = 768
		const context = canvas.getContext('2d')!
		const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
		gradient.addColorStop(0, book.palette)
		gradient.addColorStop(1, '#11151b')
		context.fillStyle = gradient
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.strokeStyle = 'rgba(244, 238, 224, .38)'
		context.lineWidth = 2
		for (let ring = 0; ring < 7; ring += 1) {
			context.beginPath()
			context.ellipse(370, 270, 65 + ring * 30, 30 + ring * 14, -0.65, 0, Math.PI * 2)
			context.stroke()
		}
		context.fillStyle = '#f3eee4'
		context.font = '600 27px system-ui, sans-serif'
		context.fillText(`B612 ARCHIVE · ${String(index + 1).padStart(2, '0')}`, 46, 66)
		context.font = '600 58px Georgia, serif'
		const characters = Array.from(book.title)
		const titleLines = [characters.slice(0, 6).join(''), characters.slice(6, 12).join('')].filter(Boolean)
		titleLines.forEach((line, lineIndex) => context.fillText(line, 46, 525 + lineIndex * 68))
		context.font = '24px system-ui, sans-serif'
		context.fillStyle = 'rgba(243, 238, 228, .72)'
		context.fillText(book.author, 48, 710)
		const texture = new THREE.CanvasTexture(canvas)
		texture.colorSpace = THREE.SRGBColorSpace
		texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
		return texture
	}

	private loadCover(book: Book, material: THREE.MeshStandardMaterial) {
		if (!book.cover) return
		const url = book.cover
		new THREE.TextureLoader().load(
			`/api/book-cover?url=${encodeURIComponent(url)}`,
			(texture) => {
				texture.colorSpace = THREE.SRGBColorSpace
				texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
				material.map?.dispose()
				material.map = texture
				material.needsUpdate = true
			},
			undefined,
			(error) => {
				console.error('[Bookshelf] Cover failed', {
					title: book.title,
					url,
					error,
				})
			},
		)
	}

	private addBooks() {
		this.books.forEach((book, index) => {
			const pageMaterial = new THREE.MeshStandardMaterial({ color: 0xe7ddca, roughness: 0.78 })
			const spineMaterial = new THREE.MeshStandardMaterial({ color: book.palette, roughness: 0.54 })
			const coverMaterial = new THREE.MeshStandardMaterial({ map: this.coverTexture(book, index), roughness: 0.46, metalness: 0.03 })
			const backMaterial = new THREE.MeshStandardMaterial({ color: book.palette, roughness: 0.62 })
			const geometry = new THREE.BoxGeometry(1.48, 2.25, 0.24, 2, 2, 1)
			const mesh = new THREE.Mesh(geometry, [pageMaterial, spineMaterial, pageMaterial, pageMaterial, coverMaterial, backMaterial])
			const baseScale = new THREE.Vector3(0.72 + ((index * 5) % 7) * 0.03, 1, 0.84 + ((index * 3) % 5) * 0.06)
			const base = new THREE.Vector3((index - (this.books.length - 1) / 2) * 1.12, -0.375, Math.sin(index * 1.7) * 0.06)
			const baseRotation = ((index % 5) - 2) * 0.022
			mesh.position.copy(base)
			mesh.scale.copy(baseScale)
			mesh.rotation.y = baseRotation
			mesh.castShadow = true
			mesh.receiveShadow = true
			mesh.userData = { index, base, baseScale, baseRotation }
			this.bookGroup.add(mesh)
			this.bookMeshes.push(mesh)
			if (book.cover) this.loadCover(book, coverMaterial)
		})
	}

	private bindEvents() {
		this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
		this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
		this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
		window.addEventListener('wheel', this.onWheel, { passive: false })
		window.addEventListener('keydown', this.onKeyDown)
		window.addEventListener('resize', this.onResize)
	}

	private setPointer(event: PointerEvent) {
		this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
	}

	private onPointerMove = (event: PointerEvent) => {
		this.setPointer(event)
		if (!this.dragging) return
		this.dragDistanceX = event.clientX - this.dragStartX
		this.dragDistanceY = event.clientY - this.dragStartY
	}

	private onPointerDown = (event: PointerEvent) => {
		this.setPointer(event)
		this.dragging = true
		this.dragStartX = event.clientX
		this.dragStartY = event.clientY
		this.dragDistanceX = 0
		this.dragDistanceY = 0
		this.renderer.domElement.setPointerCapture(event.pointerId)
	}

	private onPointerUp = (event: PointerEvent) => {
		this.setPointer(event)
		const horizontal = Math.abs(this.dragDistanceX) > Math.abs(this.dragDistanceY)
		const distance = horizontal ? this.dragDistanceX : this.dragDistanceY
		this.dragging = false
		if (Math.abs(distance) > 24) {
			const steps = THREE.MathUtils.clamp(Math.round(Math.abs(distance) / 90), 1, 3)
			this.navigate(distance < 0 ? steps : -steps)
			return
		}
		this.raycaster.setFromCamera(this.pointer, this.camera)
		const hit = this.raycaster.intersectObjects(this.bookMeshes, false)[0]
		if (hit) this.select(Number(hit.object.userData.index))
	}

	private onWheel = (event: WheelEvent) => {
		const target = event.target as Element | null
		if (target?.closest('.book-list.is-open, .book-panel.is-open')) return
		event.preventDefault()
		const deltaScale = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1
		this.wheelDistanceX += event.deltaX * deltaScale
		this.wheelDistanceY += event.deltaY * deltaScale
		window.clearTimeout(this.wheelEndTimer)
		this.wheelEndTimer = window.setTimeout(() => {
			const horizontal = Math.abs(this.wheelDistanceX) > Math.abs(this.wheelDistanceY)
			const distance = horizontal ? this.wheelDistanceX : this.wheelDistanceY
			if (Math.abs(distance) > 0.5) {
				const steps = THREE.MathUtils.clamp(Math.round(Math.abs(distance) / 90), 1, 3)
				this.navigate(distance > 0 ? steps : -steps)
			}
			this.wheelDistanceX = 0
			this.wheelDistanceY = 0
		}, 60)
	}

	private onKeyDown = (event: KeyboardEvent) => {
		const target = event.target as HTMLElement | null
		if (target?.matches('input, textarea, [contenteditable]')) return
		if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') this.navigate(-1)
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') this.navigate(1)
	}

	private onResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.position.z = window.innerWidth < 720 ? 10.5 : 12.5
		this.camera.updateProjectionMatrix()
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.35 : 1.8))
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	private navigate(step: number) {
		if (this.selectedIndex !== null) return
		this.focusIndex = THREE.MathUtils.clamp(this.focusIndex + step, 0, this.books.length - 1)
		this.updateFocusTarget()
	}

	focus(index: number) {
		this.selectedIndex = null
		this.focusIndex = THREE.MathUtils.clamp(index, 0, this.books.length - 1)
		this.updateFocusTarget()
	}

	private updateFocusTarget() {
		const focused = this.bookMeshes[this.focusIndex]
		if (!focused) return
		this.cameraXTarget = (focused.userData.base as THREE.Vector3).x
		const position = document.querySelector<HTMLElement>('.book-position')
		if (position) position.textContent = `${String(this.focusIndex + 1).padStart(2, '0')} / ${String(this.books.length).padStart(2, '0')}`
	}

	private select(index: number) {
		this.selectedIndex = index
		this.onSelect(this.books[index])
	}

	closeSelection() {
		this.selectedIndex = null
	}

	private animate = () => {
		requestAnimationFrame(this.animate)
		const now = performance.now()
		const delta = Math.min((now - this.lastFrameTime) / 1000, 0.05)
		this.lastFrameTime = now
		const dragPreviewX = this.dragging ? this.dragDistanceX / Math.max(window.innerWidth, 1) : 0
		const dragPreviewY = this.dragging ? this.dragDistanceY / Math.max(window.innerHeight, 1) : 0
		const wheelPreviewX = THREE.MathUtils.clamp(this.wheelDistanceX / 240, -0.4, 0.4)
		const wheelPreviewY = THREE.MathUtils.clamp(this.wheelDistanceY / 240, -0.4, 0.4)
		const preview = (dragPreviewX + dragPreviewY) - (wheelPreviewX + wheelPreviewY)
		this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraXTarget - preview * 4.2, 8, delta)
		this.camera.lookAt(this.camera.position.x, 0, 0)

		this.raycaster.setFromCamera(this.pointer, this.camera)
		const hover = this.raycaster.intersectObjects(this.bookMeshes, false)[0]
		this.hoveredIndex = this.canHover && hover ? Number(hover.object.userData.index) : null
		this.renderer.domElement.style.cursor = this.hoveredIndex === null ? 'grab' : 'pointer'
		const displayIndex = this.hoveredIndex ?? this.focusIndex

		this.bookMeshes.forEach((mesh, index) => {
			const base = mesh.userData.base as THREE.Vector3
			const baseScale = mesh.userData.baseScale as THREE.Vector3
			const isSelected = this.selectedIndex === index
			const isDisplayFocused = this.selectedIndex === null && displayIndex === index
			const target = isSelected
				? new THREE.Vector3(this.camera.position.x + (window.innerWidth < 720 ? 0 : -1.35), 0, 5.1)
				: base.clone()
			if (this.selectedIndex === null) {
				if (index < displayIndex) target.x -= 0.46
				if (index > displayIndex) target.x += 0.46
				if (isDisplayFocused) target.z = 1.35
			}
			const positionAlpha = 1 - Math.exp(-(isSelected ? 9 : 7) * delta)
			const scaleAlpha = 1 - Math.exp(-10 * delta)
			const rotationAlpha = 1 - Math.exp(-9 * delta)
			mesh.position.lerp(target, positionAlpha)
			const scaleMultiplier = isSelected ? 1.34 : isDisplayFocused ? 1.2 : 1
			mesh.scale.lerp(baseScale.clone().multiplyScalar(scaleMultiplier), scaleAlpha)
			const targetRotation = isSelected || isDisplayFocused ? 0 : Number(mesh.userData.baseRotation)
			mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, rotationAlpha)
		})

		this.renderer.render(this.scene, this.camera)
	}
}

const status = document.querySelector<HTMLElement>('.bookshelf-status')!
const panel = document.querySelector<HTMLElement>('.book-panel')!
const panelBackdrop = document.querySelector<HTMLElement>('.panel-backdrop')!
const list = document.querySelector<HTMLElement>('.book-list')!
const listItems = document.querySelector<HTMLElement>('.book-list-items')!
let bookshelf: BookshelfScene | null = null

function showBook(book: Book) {
	panel.querySelector('h2')!.textContent = book.title
	panel.querySelector<HTMLElement>('.panel-author')!.textContent = book.author
	panel.querySelector<HTMLElement>('.panel-status')!.textContent = book.status
	panel.querySelector<HTMLElement>('.panel-isbn')!.textContent = book.isbn || '未註明'
	panel.querySelector<HTMLElement>('.panel-rating')!.textContent = book.rating == null ? '未評分' : `${book.rating} / 5`
	panel.querySelector<HTMLElement>('.panel-finished')!.textContent = book.finishedAt ?? '未註明'
	panel.classList.add('is-open')
	panelBackdrop.classList.add('is-open')
	panel.setAttribute('aria-hidden', 'false')
}

function closePanel() {
	panel.classList.remove('is-open')
	panelBackdrop.classList.remove('is-open')
	panel.setAttribute('aria-hidden', 'true')
	bookshelf?.closeSelection()
}

function renderList(books: Book[]) {
	listItems.replaceChildren(...books.map((book, index) => {
		const button = document.createElement('button')
		button.type = 'button'
		button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span><strong></strong><small></small>`
		button.querySelector('strong')!.textContent = book.title
		button.querySelector('small')!.textContent = book.author
		button.addEventListener('click', () => {
			bookshelf?.focus(index)
			list.classList.remove('is-open')
			list.setAttribute('aria-hidden', 'true')
			document.querySelector('.list-toggle')?.setAttribute('aria-expanded', 'false')
		})
		return button
	}))
}

async function loadBookshelf() {
	try {
		const response = await fetch('/api/books', { cache: 'no-store' })
		const payload = await response.json() as { books?: Book[]; error?: string }
		if (!response.ok) throw new Error(payload.error ?? 'Bookshelf request failed.')
		const books = payload.books ?? []
		if (books.length === 0) {
			status.textContent = '書櫃目前沒有書籍。'
			return
		}
		status.hidden = true
		renderList(books)
		bookshelf = new BookshelfScene(document.querySelector<HTMLElement>('.scene')!, books, showBook)
	} catch (error) {
		console.error('[bookshelf] Failed to load books', error)
		status.textContent = '暫時無法載入書櫃，請稍後重新整理。'
		status.classList.add('is-error')
	}
}

document.querySelector('.panel-close')?.addEventListener('click', closePanel)
panelBackdrop.addEventListener('click', closePanel)
document.querySelector('.list-toggle')?.addEventListener('click', (event) => {
	const button = event.currentTarget as HTMLButtonElement
	const open = !list.classList.contains('is-open')
	list.classList.toggle('is-open', open)
	list.setAttribute('aria-hidden', String(!open))
	button.setAttribute('aria-expanded', String(open))
})
document.querySelector('.list-close')?.addEventListener('click', () => {
	list.classList.remove('is-open')
	list.setAttribute('aria-hidden', 'true')
	document.querySelector('.list-toggle')?.setAttribute('aria-expanded', 'false')
})
loadBookshelf()
