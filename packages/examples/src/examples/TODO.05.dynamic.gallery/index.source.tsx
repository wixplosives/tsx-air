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
    const deleteButton = ((imgName: string) => {
        const t = imgName;
        return <button onClick={
            () => state.images = state.images.filter(i => i.src !== t)
        } disabled={state.images.find(i => i.src === imgName)} />;
    });

    return <div className="gallery">
        {state.images.map((img, i) => <div key={img.dataId + ''}>
            <img src={`/${props.baseUrl}/${img}`}
                alt={`image ${i + 1}/${state.images.length}`} />
            {deleteButton(img.src)}
        </div>)}
    </div>;
});
