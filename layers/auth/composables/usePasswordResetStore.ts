export enum PassResetSteps{
    REQUEST = 'Request',
    CODE_VERIFICATION = 'CodeVerification',
    CHANGE_PASSWORD = 'ChangePassword',
    SUCCESS = 'Success'
}

export const usePasswordResetStore = ()=>{
    const states = {
        resetStep: useState<PassResetSteps>('usePasswordResetStore.resetSteps', ()=> PassResetSteps.REQUEST),
        email: useState<string>('usePasswordResetStore.email', ()=> '')
    }

    const actions = {
        changeStep: (step: PassResetSteps)=>{
            states.resetStep.value = step
        },
        setEmail: (email: string)=>{
            states.email.value = email
        },
        resetActions: ()=>{
            actions.changeStep(PassResetSteps.REQUEST)
            actions.setEmail('')
        }
    }

    return {
        ...states,
        ...actions
    }
}