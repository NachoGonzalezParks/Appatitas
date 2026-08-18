import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

// El componente usa vue-router (useRoute + RouterLink). En un test unitario lo
// aislamos: mockeamos useRoute y stubeamos RouterLink. Patrón reutilizable para
// testear componentes con dependencias del router.
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
}))

import LoginPage from '@/bc01-identity/pages/LoginPage.vue'

describe('LoginPage', () => {
  it('renderiza el encabezado "Ingresar"', () => {
    const wrapper = mount(LoginPage, {
      global: { stubs: { RouterLink: RouterLinkStub } },
    })
    expect(wrapper.text()).toContain('Ingresar')
  })
})
