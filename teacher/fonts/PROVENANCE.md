# PDF Font Provenance

The two TrueType files are lossless decompressions of the existing licensed Comic Neue WOFF2 files in `vendor/multiview-mystery/fonts/`, inherited from source revision `8278b388c79fc410dc91c1d9e1089df93dc011bb`. No glyph design was changed. The existing SIL Open Font License is copied into every build from `vendor/multiview-mystery/fonts/LICENSE.txt`.

Converted with fontTools 4.66.1 and Brotli 1.2.0 using `TTFont(source); font.flavor = None; font.save(destination)`. TTF embedding avoids the invalid subset outlines observed when sending WOFF2 directly through the current fontkit exporter. Both PDF.js and MuPDF validation use the actual generated PDF bytes.
