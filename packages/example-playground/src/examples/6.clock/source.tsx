import { TSXAir, bind, lifecycle } from '../../framework';

// exported to keep the example code compact 
export interface AnimatedDiv {
    // _prop will not be spread as attributes
    _isAnimating: boolean;
    // $textContent will be "spread" into the element
    $textContent: string;
    className: string;
    key: string;
}

export const Digit = TSXAir(async (props: { value: string; lastUpdate: any }) => {
    const current = bind.init({ $textContent: props.value, className: 'enter', _isAnimating: true, key: 'current' }) as AnimatedDiv;
    const next = bind.init({ $textContent: '', className: 'waiting', _isAnimating: false, key: 'next' }) as AnimatedDiv;
    let pendingValue: string | null = null;

    const doneAnimating = (elm: AnimatedDiv) => {
        elm._isAnimating = false;
    };

    bind.when(bind.wasChanged(props.lastUpdate), () => {
        pendingValue = props.value;
    });

    // bind.when(
    //     [() => (current._isAnimating || next._isAnimating) === false, bind.wasChanged(pendingValue)],
    //     async () => {
            current.className = 'no-transition exit';
            next.className = 'no-transition';
            await lifecycle.render();
            current.className = '';
            next.className = 'waiting';
            current.$textContent = next.$textContent;
            await lifecycle.render();
            if (pendingValue !== null) {
                next._isAnimating = current._isAnimating = true;
                next.$textContent = pendingValue;
                next.className = '';
                current.className = 'exit';
            }
    //     }
    // );

    return <div>
        {[current, next].map(div =>
            // It's all good mate, I've compiled it and the key is there, lambdas are also covered in compilation
            // tslint:disable-next-line: jsx-no-lambda jsx-key
            <div {...div} onTransitionEnd={() => doneAnimating(div)} />)}
    </div>;
});