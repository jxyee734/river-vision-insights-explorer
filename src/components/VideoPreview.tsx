import React from 'react';

interface VideoPreviewProps {
  videoFile: File;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoFile }) => {
  const videoUrl = URL.createObjectURL(videoFile);

  return (
    <div className="video-preview-container">
      <video controls width="100%" src={videoUrl} />
    </div>
  );
};

export default VideoPreview;