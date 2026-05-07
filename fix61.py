with open('src/app/(auth)/onboarding/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Wrapper avec Suspense
content = content.replace(
    "export default function OnboardingPage()",
    "import { Suspense } from 'react'\n\nfunction OnboardingContent()"
)

content = content + """
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
"""

with open('src/app/(auth)/onboarding/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
