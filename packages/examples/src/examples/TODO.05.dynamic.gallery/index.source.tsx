import { TSXAir, store, CompCreator, TsxAirChild, when } from '../06.factory/node_modules/@tsx-air/framework';
import { StoreData } from '@tsx-air/runtime';

const cloneElement = (eml: TsxAirChild<any>, key: string, props: StoreData) => {
    return eml;
};

export const Gallery = TSXAir((props: { baseUrl: string }) => {
    const state = store({
        images: [
            { dataId: 0, src: 'bunny.jpg' },
            { dataId: 1, src: 'gradient.jpg' },
            { dataId: 2, src: 'pretty-boy.jpg' },
            { dataId: 3, src: 'weird.jpg' }
        ]
    });
        const deleteButton = ((imgName: string) => {
            const t = imgName;
            return <button onClick={
                () => state.images = state.images.filter(i => i.src !== t)
            } disabled={!!state.images.find(i => i.src === imgName)} />;
        });

    return <div className="gallery">
        {state.images.map((img, i) => <div key={img.dataId + ''}>
            <img src={`/${props.baseUrl}/${img}`}
                alt={`image ${i + 1}/${state.images.length}`} />
            {deleteButton(img.src)}
        </div>)}
    </div>;
});

export const Repeater = TSXAir((props: { child: TsxAirChild<any>, times: number }) => {
    const state = store({ p: 'someClass' });
    const children = [];
    for (let i = 0; i < props.times; i++) {
        // What happens when a child is <div />
        children.push(cloneElement(props.child, 'key' + i, { covffeefee19: state.p }));
    }
    return <div onClick={() => { state.p = 'otherClass'; }}>
        {children}
    </div>;
});

export const WithFactory = TSXAir((props: { factory: (name: string) => TsxAirChild<any> }) => {
    const state = store({ first: '1', second: '2' });
    return <div onClick={() => { state.first = 'First!'; }}>
        {props.factory(state.first)}
        {props.factory(state.second)}
    </div>;
});

export const FactoryWrapper = TSXAir((props: { index: number }) => {
    const factory = (name: string) => <div>{name}{props.index}</div>;
    return <WithFactory factory={factory} />;
});

export const FaderParent = TSXAir(()=>{    
    const state = store({
        items:[1,2,3]
    });
    state.items = [state.items[0], state.items[1], 5];
    return <div onClick={()=>state.items  = [0]}>
        <Fader child={state.items[0]? <div>{state.items[0]}</div> : undefined}/>
        <Fader child={state.items[1]? <div>{state.items[1]}</div> : undefined}/>
        <Fader child={state.items[2]? <div>{state.items[2]}</div> : undefined}/>
        </div>;
});

export const Fader = TSXAir((props: { child: TsxAirChild<any> | undefined }) => {
    const state = store({
        // child: cloneElement(props.child, 'child', {}),
        child: props.child,
    });

    when(props.child, () => {
        if (props.child) {
            state.child = props.child;
        } else {
            setTimeout(() => { state.child = undefined }, 100);
        }
    });
    return <div className={props.child ? '' : 'fade'}>{state.child}</div>;
});