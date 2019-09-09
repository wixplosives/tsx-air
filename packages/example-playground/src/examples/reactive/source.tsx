import { TSXAir, bind } from '../../framework';

export const Derived = TSXAir((props:{a:string}) => {
    // The view is updated iff props.a is changed
    return <div>{'a = ' + props.a}</div>;
});

export const DerivedWithState = TSXAir((props: { a: string }) => {
    let count = store(0);
    const first = store(props.a);

    console.log(count); // 0
    bind.when(props.a, () => count++);
    console.log(count); // 1

    return <div>{'a = ' + props.a}<div>A was changed {count} times</div></div>;
});

