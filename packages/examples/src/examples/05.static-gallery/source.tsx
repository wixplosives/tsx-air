import { TSXAir, render, store } from '@wixc3/tsx-air-framework';
import { Thumb } from '../03.thumb/source';
import { Zoom } from '../04.zoom/source';

export const Gallery = TSXAir((props: { urls: string[] }) => {
    const state = store({
        zoomed: null as string | null
    });

    const { zoomed } = state;

    return <div className="gallery">
        {props.urls.map(url => <Thumb url={url} key={url} onClick={
            // Lambda is all good bro, we're compiling this shit
            () => state.zoomed = url} />)}
        {zoomed ?
            <div className="modal" onClick={
                e => { state.zoomed = null; e.stopPropagation(); }}>
                <Zoom url={zoomed} />
            </div> : null
        }
    </div>;
});

export const runExample = (target: HTMLElement) => {
    const urls = ['https://cdn2.thecatapi.com/images/_mtVKrRTD.jpg', 'https://cdn2.thecatapi.com/images/22CDdXQ6U.jpg',
        'https://cdn2.thecatapi.com/images/qqyh5pKKs.jpg', 'https://cdn2.thecatapi.com/images/bkmLO58jE.jpg',
        'https://cdn2.thecatapi.com/images/KUEJ039io.jpg', 'https://cdn2.thecatapi.com/images/OS1VioBop.jpg',
        'https://cdn2.thecatapi.com/images/vxK9Ac6QU.jpg', 'https://cdn2.thecatapi.com/images/c1vgfDv0b.jpg',
        'https://cdn2.thecatapi.com/images/5A6g4xtZo.jpg', 'https://cdn2.thecatapi.com/images/mt0WK1Pm_.jpg'];
    render(target, Gallery, { urls });
};