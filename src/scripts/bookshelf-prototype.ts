import * as THREE from 'three'

type Book = {
	title: string
	author: string
	isbn: string
	status: string
	palette: string
}

type SceneMode = 'orbit' | 'corridor' | 'helix'

const variantNames: Record<string, string> = {
	B: 'B · Standing shelf',
	C: 'C · Infinite tower',
}

class BookshelfScene {
	private container: HTMLElement
	private mode: SceneMode
	private books: Book[]
	private renderer: THREE.WebGLRenderer
	private scene = new THREE.Scene()
	private camera: THREE.PerspectiveCamera
	private bookGroup = new THREE.Group()
	private bookMeshes: THREE.Mesh[] = []
	private raycaster = new THREE.Raycaster()
	private pointer = new THREE.Vector2(2, 2)
	private meshWorldPosition = new THREE.Vector3()
	private startTime = performance.now()
	private lastFrameTime = performance.now()
	private selectedIndex: number | null = null
	private hoveredIndex: number | null = null
	private focusIndex = 0
	private groupRotationTarget = 0
	private cameraXTarget = 0
	private cameraYTarget = 0
	private groupZTarget = 0
	private dragStartX = 0
	private dragStartY = 0
	private dragDistance = 0
	private dragDistanceY = 0
	private wheelDistanceX = 0
	private wheelDistanceY = 0
	private wheelEndTimer: number | undefined
	private dragging = false
	private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	private canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
	private lightTheme = document.documentElement.dataset.theme === 'light'
	private frame = 0

	constructor(container: HTMLElement, mode: SceneMode, books: Book[]) {
		this.container = container
		this.mode = mode
		this.books = books
		this.focusIndex = Math.floor(books.length / 2)
		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.35 : 1.8))
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		this.renderer.outputColorSpace = THREE.SRGBColorSpace
		this.renderer.toneMapping = THREE.ACESFilmicToneMapping
		this.renderer.toneMappingExposure = 1.1
		this.renderer.shadowMap.enabled = this.mode === 'corridor'
		this.renderer.shadowMap.type = THREE.PCFShadowMap
		this.container.appendChild(this.renderer.domElement)

		this.camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100)
		const cameraDistance = this.mode === 'corridor' ? (window.innerWidth < 720 ? 10.5 : 13.5) : window.innerWidth < 720 ? 11.5 : 10
		this.camera.position.set(0, 0, cameraDistance)
		this.scene.fog = new THREE.FogExp2(this.lightTheme ? 0xeeeae1 : 0x07090d, 0.045)
		this.scene.add(this.bookGroup)
		this.addLights()
		this.addStars()
		this.addFloor()
		this.addBooks()
		this.updateNavigationTargets()
		this.bindEvents()
		this.animate()
	}

	private addLights() {
		this.scene.add(new THREE.AmbientLight(this.lightTheme ? 0xfff6e6 : 0xc4ced8, this.lightTheme ? 2 : 1.4))
		const warm = new THREE.DirectionalLight(0xffb497, 4.8)
		warm.position.set(5, 7, 9)
		warm.castShadow = this.mode === 'corridor'
		warm.shadow.mapSize.set(1024, 1024)
		this.scene.add(warm)
		const cool = new THREE.PointLight(0x6e9fcc, 30, 22)
		cool.position.set(-6, -3, 4)
		this.scene.add(cool)
	}

	private addStars() {
		const mobile = window.innerWidth < 720
		const count = mobile ? 520 : 1300
		const positions = new Float32Array(count * 3)
		for (let i = 0; i < count; i += 1) {
			const radius = 10 + Math.random() * 35
			const angle = Math.random() * Math.PI * 2
			positions[i * 3] = Math.cos(angle) * radius
			positions[i * 3 + 1] = (Math.random() - 0.5) * 24
			positions[i * 3 + 2] = Math.sin(angle) * radius - 8
		}
		const geometry = new THREE.BufferGeometry()
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
		const material = new THREE.PointsMaterial({ color: this.lightTheme ? 0x6d685e : 0xd9d2c5, size: mobile ? 0.025 : 0.035, transparent: true, opacity: this.lightTheme ? 0.38 : 0.7 })
		this.scene.add(new THREE.Points(geometry, material))
	}

	private addFloor() {
		if (this.mode !== 'corridor') return
		const geometry = new THREE.PlaneGeometry(80, 16)
		const material = new THREE.MeshStandardMaterial({
			color: this.lightTheme ? 0xe8e4dc : 0x111318,
			roughness: 0.92,
		})
		const floor = new THREE.Mesh(geometry, material)
		floor.position.set(0, -1.52, -0.25)
		floor.rotation.x = -Math.PI / 2
		floor.receiveShadow = true
		this.scene.add(floor)
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
		context.font = '600 62px Georgia, serif'
		const titleLines = book.title.length > 4 ? [book.title.slice(0, 4), book.title.slice(4)] : [book.title]
		titleLines.forEach((line, lineIndex) => context.fillText(line, 46, 525 + lineIndex * 70))
		context.font = '24px system-ui, sans-serif'
		context.fillStyle = 'rgba(243, 238, 228, .72)'
		context.fillText(book.author, 48, 710)
		const texture = new THREE.CanvasTexture(canvas)
		texture.colorSpace = THREE.SRGBColorSpace
		texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())
		return texture
	}

	private addBooks() {
		this.books.forEach((book, index) => {
			const cover = this.coverTexture(book, index)
			const pageMaterial = new THREE.MeshStandardMaterial({ color: 0xe7ddca, roughness: 0.78 })
			const spineMaterial = new THREE.MeshStandardMaterial({ color: book.palette, roughness: 0.54 })
			const coverMaterial = new THREE.MeshStandardMaterial({ map: cover, roughness: 0.46, metalness: 0.03 })
			const backMaterial = new THREE.MeshStandardMaterial({ color: book.palette, roughness: 0.62 })
			const geometry = new THREE.BoxGeometry(1.48, 2.25, 0.24, 2, 2, 1)
			const mesh = new THREE.Mesh(geometry, [pageMaterial, spineMaterial, pageMaterial, pageMaterial, coverMaterial, backMaterial])
			const baseScale = this.scaleFor(index)
			const base = this.positionFor(index, baseScale.y)
			mesh.position.copy(base)
			mesh.scale.copy(baseScale)
			mesh.castShadow = this.mode === 'corridor'
			mesh.receiveShadow = this.mode === 'corridor'
			const baseRotation = this.mode === 'corridor' ? ((index % 5) - 2) * 0.022 : 0
			mesh.userData = { index, base: base.clone(), baseRotation, baseScale }
			mesh.rotation.y = baseRotation
			this.bookGroup.add(mesh)
			this.bookMeshes.push(mesh)
		})

		if (this.mode === 'helix') this.bookGroup.position.x = window.innerWidth < 720 ? 0 : 2.4
	}

	private scaleFor(index: number) {
		if (this.mode !== 'corridor') return new THREE.Vector3(1, 1, 1)
		const width = 0.7 + ((index * 5) % 7) * 0.035
		const depth = 0.82 + ((index * 3) % 5) * 0.07
		return new THREE.Vector3(width, 1, depth)
	}

	private positionFor(index: number, heightScale = 1) {
		if (this.mode === 'corridor') {
			const x = (index - (this.books.length - 1) / 2) * 1.12
			const y = -1.5 + 1.125 * heightScale
			return new THREE.Vector3(x, y, Math.sin(index * 1.7) * 0.06)
		}
		if (this.mode === 'helix') {
			const angle = index * 0.78
			return new THREE.Vector3(Math.cos(angle) * 3.2, (index - (this.books.length - 1) / 2) * 0.72, Math.sin(angle) * 3.2)
		}
		const perRing = 10
		const ring = Math.floor(index / perRing)
		const angle = (index % perRing) / perRing * Math.PI * 2 + ring * 0.34
		const radius = 3.4 + ring * 2.25
		return new THREE.Vector3(
			Math.cos(angle) * radius + (window.innerWidth < 720 ? 0 : 1.8),
			Math.sin(angle) * (1.65 + ring * 0.42),
			-ring * 2.5 + Math.sin(angle) * 0.5,
		)
	}

	private bindEvents() {
		this.container.dataset.focusIndex = String(this.focusIndex)
		this.renderer.domElement.addEventListener('pointermove', this.onPointerMove)
		this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown)
		this.renderer.domElement.addEventListener('pointerup', this.onPointerUp)
		window.addEventListener('wheel', this.onWheel, { passive: false })
		window.addEventListener('resize', this.onResize)
	}

	private onPointerMove = (event: PointerEvent) => {
		this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
		this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
		if (this.dragging) {
			this.dragDistance = event.clientX - this.dragStartX
			this.dragDistanceY = event.clientY - this.dragStartY
		}
	}

	private onPointerDown = (event: PointerEvent) => {
		this.dragging = true
		this.dragStartX = event.clientX
		this.dragStartY = event.clientY
		this.dragDistance = 0
		this.dragDistanceY = 0
		this.renderer.domElement.setPointerCapture(event.pointerId)
	}

	private onPointerUp = (_event: PointerEvent) => {
		const horizontal = Math.abs(this.dragDistance) > Math.abs(this.dragDistanceY)
		const distance = horizontal ? this.dragDistance : this.dragDistanceY
		this.dragging = false
		if (Math.abs(distance) > 24) {
			const steps = THREE.MathUtils.clamp(Math.round(Math.abs(distance) / 90), 1, 3)
			if (horizontal) this.navigate(distance < 0 ? steps : -steps, 0)
			else this.navigate(0, distance < 0 ? -steps : steps)
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
				if (horizontal) this.navigate(distance > 0 ? steps : -steps, 0)
				else this.navigate(0, distance > 0 ? steps : -steps)
			}
			this.wheelDistanceX = 0
			this.wheelDistanceY = 0
		}, 60)
	}

	private onResize = () => {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth < 720 ? 1.35 : 1.8))
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	navigate(dx: number, dy: number) {
		if (this.selectedIndex !== null) return

		if (this.mode === 'orbit') {
			const perRing = 10
			const maxRing = Math.ceil(this.books.length / perRing) - 1
			let ring = Math.floor(this.focusIndex / perRing)
			let slot = this.focusIndex % perRing
			if (dx !== 0) {
				const countInRing = Math.min(perRing, this.books.length - ring * perRing)
				slot = (slot + dx + countInRing) % countInRing
				this.groupRotationTarget -= dx * Math.PI * 2 / countInRing
			}
			if (dy !== 0) ring = THREE.MathUtils.clamp(ring + dy, 0, maxRing)
			this.focusIndex = Math.min(ring * perRing + slot, this.books.length - 1)
		} else if (this.mode === 'corridor') {
			const step = dx !== 0 ? dx : dy
			this.focusIndex = THREE.MathUtils.clamp(this.focusIndex + step, 0, this.books.length - 1)
		} else {
			this.focusIndex = THREE.MathUtils.clamp(this.focusIndex + dy, 0, this.books.length - 1)
			this.groupRotationTarget += dx * 0.78
		}

		this.updateNavigationTargets()
		this.container.dataset.focusIndex = String(this.focusIndex)
	}

	private updateNavigationTargets() {
		const focused = this.bookMeshes[this.focusIndex]
		if (!focused) return
		const base = focused.userData.base as THREE.Vector3
		this.cameraXTarget = this.mode === 'corridor' ? base.x : 0
		this.cameraYTarget = this.mode === 'helix' ? base.y : this.mode === 'corridor' ? base.y * 0.2 : 0
		this.groupZTarget = this.mode === 'orbit' ? Math.floor(this.focusIndex / 10) * 2.5 : 0
	}

	select(index: number) {
		this.selectedIndex = index
		const book = this.books[index]
		const panel = document.querySelector<HTMLElement>('.book-panel')!
		panel.querySelector('h2')!.textContent = book.title
		panel.querySelector<HTMLElement>('.panel-author')!.textContent = book.author
		panel.querySelector<HTMLElement>('.panel-status')!.textContent = book.status
		panel.querySelector<HTMLElement>('.panel-isbn')!.textContent = book.isbn
		panel.classList.add('is-open')
		panel.setAttribute('aria-hidden', 'false')
	}

	closeSelection() {
		this.selectedIndex = null
	}

	private animate = () => {
		this.frame = requestAnimationFrame(this.animate)
		const now = performance.now()
		const elapsed = (now - this.startTime) / 1000
		const delta = Math.min((now - this.lastFrameTime) / 1000, 0.05)
		this.lastFrameTime = now
		const dragPreviewX = this.dragging ? this.dragDistance / Math.max(window.innerWidth, 1) : 0
		const dragPreviewY = this.dragging ? this.dragDistanceY / Math.max(window.innerHeight, 1) : 0
		const wheelPreviewX = THREE.MathUtils.clamp(this.wheelDistanceX / 240, -0.4, 0.4)
		const wheelPreviewY = THREE.MathUtils.clamp(this.wheelDistanceY / 240, -0.4, 0.4)
		const previewX = dragPreviewX - wheelPreviewX
		const previewY = dragPreviewY - wheelPreviewY
		const rotationPreview = this.mode === 'orbit' || this.mode === 'helix' ? -previewX * 1.35 : 0
		const cameraXPreview = this.mode === 'corridor' ? -previewX * 4.2 : 0
		const cameraYPreview = this.mode === 'corridor' || this.mode === 'helix' ? -previewY * 3.2 : 0
		this.bookGroup.rotation.y = THREE.MathUtils.damp(this.bookGroup.rotation.y, this.groupRotationTarget + rotationPreview, 8, delta)
		this.bookGroup.position.y = THREE.MathUtils.damp(this.bookGroup.position.y, this.mode === 'orbit' ? previewY * 1.4 : 0, 9, delta)
		this.bookGroup.position.z = THREE.MathUtils.damp(this.bookGroup.position.z, this.groupZTarget + (this.mode === 'orbit' ? previewY * 2 : 0), 8, delta)
		this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.cameraXTarget + cameraXPreview, 8, delta)
		this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.cameraYTarget + cameraYPreview, 8, delta)
		const lookTarget = new THREE.Vector3(
			this.mode === 'corridor' ? this.camera.position.x : this.mode === 'helix' ? this.bookGroup.position.x : 0,
			this.mode === 'helix' ? this.camera.position.y : 0,
			0,
		)
		this.camera.lookAt(lookTarget)

		this.raycaster.setFromCamera(this.pointer, this.camera)
		const hover = this.raycaster.intersectObjects(this.bookMeshes, false)[0]
		this.hoveredIndex = hover ? Number(hover.object.userData.index) : null
		this.renderer.domElement.style.cursor = this.hoveredIndex === null ? 'default' : 'pointer'

		this.bookMeshes.forEach((mesh, index) => {
			const base = mesh.userData.base as THREE.Vector3
			const isSelected = this.selectedIndex === index
			const isHovered = this.hoveredIndex === index && this.selectedIndex === null
			const displayIndex = this.canHover && this.hoveredIndex !== null ? this.hoveredIndex : this.focusIndex
			const isDisplayFocused = displayIndex === index && this.selectedIndex === null
			let target = isSelected
				? new THREE.Vector3(
					this.mode === 'corridor' ? this.camera.position.x + (window.innerWidth < 720 ? 0 : -1.35) : window.innerWidth < 720 ? 0 : -1.35,
					this.mode === 'helix' ? this.camera.position.y : 0,
					5.1,
				)
				: base.clone()
			if (this.mode === 'corridor' && this.selectedIndex === null) {
				if (index < displayIndex) target.x -= 0.46
				if (index > displayIndex) target.x += 0.46
				if (isDisplayFocused) target.z = 1.35
			}
			if (this.mode === 'helix' && isDisplayFocused) {
				const worldTarget = new THREE.Vector3(
					window.innerWidth < 720 ? 0 : 2.8,
					this.camera.position.y + (window.innerWidth < 720 ? -1.15 : 0),
					4.5,
				)
				target = this.bookGroup.worldToLocal(worldTarget)
			}
			if (!isSelected && !this.reducedMotion && this.mode !== 'corridor') target.y += Math.sin(elapsed * 0.8 + index * 1.8) * 0.035
			const positionAlpha = 1 - Math.exp(-(isSelected ? 9 : 7) * delta)
			const scaleAlpha = 1 - Math.exp(-10 * delta)
			const rotationAlpha = 1 - Math.exp(-9 * delta)
			mesh.position.lerp(target, positionAlpha)
			const scaleMultiplier = isSelected ? 1.34 : isDisplayFocused ? (this.mode === 'corridor' ? 1.2 : 1.26) : isHovered ? 1.12 : 1
			const baseScale = mesh.userData.baseScale as THREE.Vector3
			mesh.scale.lerp(baseScale.clone().multiplyScalar(scaleMultiplier), scaleAlpha)
			let targetRotation = isSelected || isDisplayFocused ? 0 : Number(mesh.userData.baseRotation)
			if (this.mode === 'helix' && !isSelected) {
				mesh.getWorldPosition(this.meshWorldPosition)
				const worldRotation = Math.atan2(
					this.camera.position.x - this.meshWorldPosition.x,
					this.camera.position.z - this.meshWorldPosition.z,
				)
				const localRotation = worldRotation - this.bookGroup.rotation.y
				const rotationDelta = Math.atan2(
					Math.sin(localRotation - mesh.rotation.y),
					Math.cos(localRotation - mesh.rotation.y),
				)
				targetRotation = mesh.rotation.y + rotationDelta
			}
			mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, rotationAlpha)
		})

		this.renderer.render(this.scene, this.camera)
	}

	dispose() {
		cancelAnimationFrame(this.frame)
		this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove)
		this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown)
		this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp)
		window.removeEventListener('wheel', this.onWheel)
		window.clearTimeout(this.wheelEndTimer)
		window.removeEventListener('resize', this.onResize)
		this.scene.traverse((object) => {
			if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
				object.geometry.dispose()
				const materials = Array.isArray(object.material) ? object.material : [object.material]
				materials.forEach((material) => {
					if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose()
					material.dispose()
				})
			}
		})
		this.renderer.dispose()
		this.container.replaceChildren()
	}
}

let activeScene: BookshelfScene | null = null
let activeVariant = 'B'

function showVariant(nextVariant: string) {
	activeVariant = variantNames[nextVariant] ? nextVariant : 'B'
	activeScene?.dispose()
	document.querySelectorAll<HTMLElement>('.prototype-variant').forEach((variant) => {
		variant.classList.toggle('is-active', variant.dataset.variant === activeVariant)
	})
	const active = document.querySelector<HTMLElement>(`.prototype-variant[data-variant="${activeVariant}"]`)!
	const container = active.querySelector<HTMLElement>('.scene')!
	const books = JSON.parse(container.dataset.books ?? '[]') as Book[]
	activeScene = new BookshelfScene(container, active.dataset.scene as SceneMode, books)
	document.querySelectorAll<HTMLButtonElement>('.prototype-switcher button').forEach((button) => {
		const isCurrent = button.dataset.variantTarget === activeVariant
		if (isCurrent) button.setAttribute('aria-current', 'true')
		else button.removeAttribute('aria-current')
	})
	const url = new URL(window.location.href)
	url.searchParams.set('variant', activeVariant)
	window.history.replaceState({}, '', url)
}

document.querySelectorAll<HTMLButtonElement>('.prototype-switcher button').forEach((button) => {
	button.addEventListener('click', () => showVariant(button.dataset.variantTarget ?? 'B'))
})

const themeToggle = document.querySelector<HTMLButtonElement>('.theme-toggle')
function syncThemeButton() {
	if (themeToggle) themeToggle.textContent = document.documentElement.dataset.theme === 'light' ? 'Dark' : 'Light'
}
themeToggle?.addEventListener('click', () => {
	const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
	document.documentElement.dataset.theme = nextTheme
	const url = new URL(window.location.href)
	url.searchParams.set('theme', nextTheme)
	window.history.replaceState({}, '', url)
	syncThemeButton()
	showVariant(activeVariant)
})
syncThemeButton()

document.addEventListener('keydown', (event) => {
	const target = event.target as HTMLElement
	if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return
	const direction: Record<string, [number, number]> = {
		ArrowLeft: [-1, 0],
		ArrowRight: [1, 0],
		ArrowUp: [0, -1],
		ArrowDown: [0, 1],
	}
	if (direction[event.key]) {
		event.preventDefault()
		activeScene?.navigate(...direction[event.key])
	}
	if (event.key === 'Escape') closePanel()
})

const panel = document.querySelector<HTMLElement>('.book-panel')!
function closePanel() {
	panel.classList.remove('is-open')
	panel.setAttribute('aria-hidden', 'true')
	activeScene?.closeSelection()
}
panel.querySelector<HTMLButtonElement>('.panel-close')!.addEventListener('click', closePanel)

const listToggle = document.querySelector<HTMLButtonElement>('.list-toggle')!
const bookList = document.querySelector<HTMLElement>('.book-list')!
listToggle.addEventListener('click', () => {
	const willOpen = !bookList.classList.contains('is-open')
	bookList.classList.toggle('is-open', willOpen)
	bookList.setAttribute('aria-hidden', String(!willOpen))
	listToggle.setAttribute('aria-expanded', String(willOpen))
	listToggle.textContent = willOpen ? 'Close list' : 'List view'
})

bookList.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
	button.addEventListener('click', () => {
		bookList.classList.remove('is-open')
		bookList.setAttribute('aria-hidden', 'true')
		listToggle.setAttribute('aria-expanded', 'false')
		listToggle.textContent = 'List view'
		activeScene?.select(Number(button.dataset.bookIndex))
	})
})

const initialVariant = new URL(window.location.href).searchParams.get('variant')?.toUpperCase() ?? 'B'
showVariant(initialVariant)
