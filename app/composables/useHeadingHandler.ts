export interface IHeadingSetting {
    title: string;
    subtitle?: string;
    hasBackBtn: boolean;
    backLink?: string;
}
export const useHeadingHandler = () => {
    const states ={
        headingData: useState<IHeadingSetting>('useHeadingHandler.headingData', () =>({
            title:"Welcome Back",
            subtitle:"Let's get to know you better",
            hasBackBtn: false,
            backLink:""
        }))
    }

    const actions = {
        setHeading(payload:IHeadingSetting){
            states.headingData.value = payload
        }
    }

    return {
        ...states,
        ...actions
    }
}