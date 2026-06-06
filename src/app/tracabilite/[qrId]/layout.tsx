import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function TracabiliteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ background: '#f5f3ef', padding: '12px 16px', display: 'flex', justifyContent: 'flex-end' }}>
        <LanguageSwitcher />
      </div>
      {children}
    </>
  )
}