import { TSXAir, store } from '@tsx-air/framework';

export const BarakGL = TSXAir((props: {}) => {
    const state = store({
        images: [
            'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcRmg8jZZxMEto3zidnhw34DcepW9UU0tQ8Vag&usqp=CAU',
            'https://www.inspain.org/imgs3/sitios/0/7/2/pgssl4y3xfyv5fdofw72sthtsu_2000.jpg'
        ],
        parts: 5,
        current: 0
    });

    function renderParts() {
        const cubes = [];
        for (let i = 0; i < state.parts; i++) {
            cubes.push(<Cube src={state.images[state.current]} />);
        }
        return cubes;
    }

    return <div>{renderParts()}</div>;
});

function Cube({ size = 200, rotation = 0, src = '' }) {
    return (
        <div
            className="cube"
            style={{ ['--cube-size' as any]: `${size}px`, ['--cube-rotation' as any]: `${rotation}deg` }}
        >
            <div className="cube__face cube__face--front">
                <img src={src} />
            </div>
            <div className="cube__face cube__face--back">back</div>
            <div className="cube__face cube__face--right">right</div>
            <div className="cube__face cube__face--left">left</div>
            <div className="cube__face cube__face--top">top</div>
            <div className="cube__face cube__face--bottom">bottom</div>
        </div>
    );
}
