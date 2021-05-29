import { TSXAir, store, when, memo } from '@tsx-air/framework';

export const Thumb = TSXAir((props: { imageId: string, resolution: 'high' | 'low' }) => {
    const state = store({
        imageLoaded: false,
        metaData: 'Loading metadata'
    });

    when(props.imageId, () => {
        state.imageLoaded = false;
        state.metaData = 'Loading metadata';
    });
    const title = memo(() => {
        fetch(`/meta/${props.imageId}.json`)
            .then(r => r.json()).then(meta => state.metaData = meta.hover)
            .catch(() => state.metaData = 'No metadata');

        return `${props.imageId.replace(/^.*\//g, '').replace(/\.\w{0,3}$/, '')}`;
    });

    const imgUrl = `${
        props.resolution === 'high' ? '/images' : '/low-res'
        }/${props.imageId}.jpg`;

    return <div className="thumb" >
        <div className="title">{title}</div>
        {state.imageLoaded ? '' : <div className="preloader" />}
        <img src={imgUrl} onLoad={() => state.imageLoaded = true}
            style={{ display: state.imageLoaded ? 'block' : 'none' }}
            title={state.metaData} />
    </div>;
});
