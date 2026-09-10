export const useOnboardingStore = () => {

    const states = {
        inviteIsAccpeted: useState<boolean>('useOnboardingStore.invite_accepted', () => false),
    }

    const actions = {
        acceptInvitation(){
            states.inviteIsAccpeted.value = true
        }
    }

    return {...states, ...actions}
}