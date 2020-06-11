import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./previewer.css";

type ProcessGenerateFinalVideoParams = {
  lines: {
    videos: {
      video: string;
      videoDuration: number;
    }[];
    audio: string;
    audioDuration: number;
  }[];
  globalVoiceOver?: string;
};

type LineProps = ProcessGenerateFinalVideoParams["lines"][number];

const Video = (props: {
  src: string;
  speed: number;
  duration: number;
  play: boolean;
  onFinish: () => void;
}) => {
  const [played, setPlayed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  useLayoutEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = props.speed;
    }
  }, [videoRef, props.speed]);
  useEffect(() => {
    if (!props.play) {
      return;
    }
    if (!props.src) {
      const timer = setTimeout(() => {
        props.onFinish();
      }, (props.duration / props.speed) * 1000);
      return () => clearTimeout(timer);
    } else {
      videoRef.current?.play();
    }
  }, [props.play]);
  if (played || !props.src) {
    return null;
  }
  return (
    <video
      ref={videoRef}
      muted={true}
      src={props.src}
      preload="auto"
      style={{ display: props.play ? "block" : "none" }}
      onEnded={() => {
        setPlayed(true);
        props.onFinish();
      }}
    />
  );
};

const Line = ({
  line,
  onFinish,
  active,
  hasGlobalVoiceOver,
}: {
  line: LineProps;
  active: boolean;
  onFinish: () => void;
  hasGlobalVoiceOver?: boolean;
}) => {
  const speed = useMemo(() => {
    const totalVideoDuration = line.videos
      .map((v) => v.videoDuration)
      .reduce((a, b) => a + b, 0);
    return totalVideoDuration / line.audioDuration;
  }, [line]);
  const [videoIndex, setVideoIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (active) {
      audioRef.current?.play();
    }
  }, [active]);
  return (
    <>
      {line.videos.map((video, index) => (
        <Video
          key={index}
          src={video.video}
          duration={video.videoDuration}
          speed={speed}
          play={active && videoIndex === index}
          onFinish={() => {
            if (videoIndex < line.videos.length - 1) {
              setVideoIndex((p) => p + 1);
            } else {
              onFinish();
            }
          }}
        />
      ))}
      {!hasGlobalVoiceOver && (
        <audio src={line.audio} preload="auto" ref={audioRef} />
      )}
    </>
  );
};

const Previewer = () => {
  const [currentLine, setCurrentLine] = useState(0);
  const {
    lines,
    globalVoiceOver,
  }: ProcessGenerateFinalVideoParams = JSON.parse(
    decodeURIComponent(window.location.hash.slice(1))
  );
  const [play, setPlay] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(true);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (play) {
      audioRef.current?.play();
    }
  }, [play]);
  return (
    <div className={`canvas ${finished ? "finished" : "playing"}`}>
      {lines.map((line, index) => (
        <Line
          line={line}
          key={index}
          active={play && currentLine === index}
          onFinish={() => {
            if (currentLine < lines.length - 1) {
              setCurrentLine((p) => p + 1);
            } else {
              setFinished(true);
            }
          }}
          hasGlobalVoiceOver={globalVoiceOver != null}
        />
      ))}
      {globalVoiceOver != null && (
        <audio src={globalVoiceOver} preload="auto" ref={audioRef} />
      )}
      {showPlayButton && (
        <img
          id="play"
          className="play-button"
          src={require("./play.svg")}
          alt="Play"
          onClick={() => {
            setShowPlayButton(false);
            setTimeout(() => setPlay(true), 1000);
          }}
        />
      )}
    </div>
  );
};

export default Previewer;
