import { Inter } from '@next/font/google'
import siteMetadata from '@/data/siteMetadata'
import headerNavLinks from '@/data/headerNavLinks'
import Link from './Link'
import SectionContainer from './SectionContainer'
import Footer from './Footer'
import MobileNav from './MobileNav'
import ThemeSwitch from './ThemeSwitch'
import { ReactNode } from 'react'
import { useRouter } from 'next/router'

interface Props {
  children: ReactNode | any
}

const inter = Inter({
  subsets: ['latin'],
})

const LayoutWrapper = ({ children }: Props) => {
  const pathName = useRouter().pathname
  return (
    <SectionContainer>
      <div className={`${inter.className} flex h-screen flex-col justify-between font-sans`}>
        <header className='flex items-center justify-between py-8'>
          <div>
            <Link href='/' aria-label={siteMetadata.headerTitle}>
              <div className='flex items-center justify-between'>
                {typeof siteMetadata.headerTitle === 'string' ? (
                  <div className='text-2xl font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300 dark:hover:text-primary-400 md:text-4xl'>
                    {siteMetadata.headerTitle}
                  </div>
                ) : (
                  siteMetadata.headerTitle
                )}
              </div>
            </Link>
          </div>
          <div className='flex items-center text-base leading-5'>
            <div className='hidden sm:block'>
              {headerNavLinks.map((link) => (
                <Link
                  key={link.title}
                  href={link.href}
                  className={`p-1 font-medium  sm:p-4 ${
                    link.href === pathName
                      ? 'text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 '
                      : 'text-gray-700 hover:text-primary-600  dark:text-gray-100 dark:hover:text-primary-400 '
                  }`}
                >
                  {link.title}
                </Link>
              ))}
            </div>
            <ThemeSwitch />
            <MobileNav />
          </div>
        </header>
        <main className='mb-auto'>{children}</main>
        <Footer />
      </div>
    </SectionContainer>
  )
}

export default LayoutWrapper
