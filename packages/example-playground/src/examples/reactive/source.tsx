import { TSXAir, bind, lifecycle } from '../../framework';

export const Derived = TSXAir((props:{a:string}) => {
    // The view is updated iff props.a is changed
    return <div>{'a = ' + props.a}</div>;
});

export const DerivedWithState = TSXAir((props: { a: string }) => {
    let count = store(0);
    const first = store(props.a);
    bind.when(props.a, () => count++);
    
    return <div>{'a = ' + props.a}<div>A was changed {count} times</div></div>;
});