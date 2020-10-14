import { TSXAir, store } from '@tsx-air/framework';

export const Gallery = TSXAir((props: { baseUrl: string }) => {
    const state = store({
        images: [
            { dataId: 0, src: 'bunny.jpg' },
            { dataId: 1, src: 'gradient.jpg' },
            { dataId: 2, src: 'pretty-boy.jpg' },
            { dataId: 3, src: 'weird.jpg' }
        ]
    });
    // const deleteButton = (imgName: string) => {
    //     return <button onClick={
    //         () => {
    //             // debugger
    //             return state.images = state.images.filter(i => i.src !== imgName)}
    //     } disabled={state.images.length < 2}>Remove</button>;
    // };

    return <div className="gallery"
        onClick={() => console.log('clicked')}
    >
        {state.images.map((img, i) => <div key={img.dataId + ''}>
            <img src={`/${props.baseUrl}/${img.src}`}
                title={`image ${i + 1}/${state.images.length}`}
                onClick={() => console.log(img.src)}
            />
            {/* {deleteButton(img.src)} */}
        </div>)}
    </div>;
});
