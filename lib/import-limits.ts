export const MAX_COURSE_FILE=50*1024*1024;
export const MAX_VISION_IMAGE=12*1024*1024;
export const MAX_STORAGE_BYTES=1024*1024*1024;
export const MAX_COURSE_TEXT=500000;
export const MAX_PDF_PAGES=150;
export function imageDimensions(width:number,height:number,maxSide=3600){const scale=Math.min(1,maxSide/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};}
