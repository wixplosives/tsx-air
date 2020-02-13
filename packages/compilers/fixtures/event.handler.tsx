import { TSXAir, store } from '@tsx-air/framework';
export const Comp = TSXAir(() => {
    const state = store({ count: 0 });
    const onClick = () => state.count++;
    return <div onClick={onClick}>{state.count}</div>;
});
