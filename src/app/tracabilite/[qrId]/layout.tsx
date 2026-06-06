import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function TracabiliteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 100 }}>
        <LanguageSwitcher />
      </div>
      {children}
    </>
  )
}
