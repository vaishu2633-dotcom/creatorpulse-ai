import thumb1 from './thumb-1.svg';
import thumb2 from './thumb-2.svg';
import thumb3 from './thumb-3.svg';
import thumb4 from './thumb-4.svg';
import thumb5 from './thumb-5.svg';
import thumb6 from './thumb-6.svg';

const thumbnails = [thumb1, thumb2, thumb3, thumb4, thumb5, thumb6];

export function getSampleThumbnail(index = 0, postType = '') {
  if (postType === 'video' || postType === 'long_video') return thumb1;
  if (postType === 'reel' || postType === 'short') return thumb4;
  if (postType === 'thread' || postType === 'tweet') return thumb2;
  if (postType === 'carousel') return thumb5;
  if (postType === 'article') return thumb6;
  return thumbnails[Math.abs(index) % thumbnails.length];
}

export default thumbnails;
