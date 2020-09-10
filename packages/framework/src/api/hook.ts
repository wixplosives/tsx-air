export const Hook=(action:()=>any)=>{
    // @ts-ignore
    action.isHook = true;
    return action;
};