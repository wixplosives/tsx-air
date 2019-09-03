import { TSXAir, render } from '../../framework';
import { Thumb } from '../3.thumb/source';
import { Zoom } from '../4.zoom/source';

export const Gallery = TSXAir((props: { urls: string[] }) => {
    let zoomed: string | null = null;
    return <div className="gallery">
        {props.urls.map(url => <Thumb url={url} key={url} onClick={
            // Lambda is all good bro, we're compiling this shit
            // tslint:disable-next-line: jsx-no-lambda
            () => zoomed = url} />)}
        {zoomed ?
            <div className="modal" onClick={
                // tslint:disable-next-line: jsx-no-lambda
                e => { zoomed = null; e.stopPropagation(); }}>
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