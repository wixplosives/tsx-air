import { TSXAir, lifecycle } from '../../framework';

interface AnimatedDiv {
    // _prop will not be spread as attributes
    _isAnimating: boolean;
    // $textContent will be "spread" into the element
    $textContent: string;
    className: string;
    key: string;
}

export const Digit = TSXAir((props: { value: string; lastUpdate: any }) => {
    const current: AnimatedDiv = { $textContent: props.value, className: 'enter', _isAnimating: true, key: 'current' };
    const next: AnimatedDiv = { $textContent: '', className: 'waiting', _isAnimating: false, key: 'next' };
    let pendingValue: string | null = null;

    const doneAnimating = (elm: AnimatedDiv) => {
        elm._isAnimating = false;
    };

    lifecycle.beforeUpdate((newProps:{value:string, lastUpdate:any}) => {
        if (props.lastUpdate !== newProps.lastUpdate) {
            pendingValue = newProps.value;
        }
    });

    lifecycle.afterUpdate(async () => {
        if (!current._isAnimating && !next._isAnimating) {
            current.className = 'no-transition exit';
            next.className = 'no-transition';
            await lifecycle.render();
            current.className = '';
            next.className = 'waiting';
            current.$textContent = next.$textContent;
            await lifecycle.render();
            if (pendingValue !== null) {
                next.$textContent = pendingValue;
                next.className = '';
                current.className = 'exit';
            }
        }
    });

    return <div>
        {[current, next].map(div =>
            // It's all good mate, I've compiled it and the key is there, lambdas are also covered in compilation
            // tslint:disable-next-line: jsx-no-lambda jsx-key
            <div {...div} onTransitionEnd={() => doneAnimating(div)} />)}
    </div>;
});