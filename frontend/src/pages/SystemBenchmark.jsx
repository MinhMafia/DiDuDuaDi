import React, { useEffect, useState } from "react";
import { Card, Typography, Tag, Button } from "antd";

const { Text } = Typography;

const SystemBenchMark = () => {
  const [info, setInfo] = useState(null);
  const [cpuTime, setCpuTime] = useState(null);
  const [fps, setFps] = useState(null);
  const [audioReady, setAudioReady] = useState(null);

  useEffect(() => {
    // 📌 System info
    const system = {
      cores: navigator.hardwareConcurrency,
      memory: navigator.deviceMemory || "N/A",
      platform: navigator.platform,
    };

    setInfo(system);

    // 🧠 CPU test
    const cpuTest = () => {
      const start = performance.now();
      let x = 0;
      for (let i = 0; i < 2e7; i++) x += i;
      return performance.now() - start;
    };

    // 🎮 FPS test
    const fpsTest = () => {
      return new Promise((resolve) => {
        let frames = 0;
        let start = performance.now();

        function loop() {
          frames++;
          if (performance.now() - start > 500) {
            resolve(Math.round(frames * 2));
            return;
          }
          requestAnimationFrame(loop);
        }

        loop();
      });
    };

    // 🔊 Audio check
    const checkAudio = async () => {
      try {
        const audio = new Audio(
          "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAA"
        );
        await audio.play();
        setAudioReady(true);
      } catch {
        setAudioReady(false);
      }
    };

    setTimeout(async () => {
      setCpuTime(cpuTest());
      setFps(await fpsTest());
      checkAudio();
    }, 300);
  }, []);

  // 🔊 Enable audio manually
  const enableAudio = async () => {
    try {
      const audio = new Audio(
        "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAA"
      );
      await audio.play();
      setAudioReady(true);
    } catch {
      setAudioReady(false);
    }
  };

  // 🎯 Rating
  const cpuLevel =
    cpuTime < 200
      ? ["green", "Strong"]
      : cpuTime < 500
      ? ["orange", "Medium"]
      : ["red", "Weak"];

  const fpsLevel =
    fps > 50
      ? ["green", "Smooth"]
      : fps > 30
      ? ["orange", "Normal"]
      : ["red", "Low"];

  return (
    <div style={styles.container}>
      <Card size="small" style={styles.card}>
        <Text strong>🖥 System</Text>
        <br />

        {info && (
          <>
            <Text>CPU: {info.cores} cores</Text>
            <br />
            <Text>RAM: {info.memory} GB</Text>
            <br />
          </>
        )}

        {cpuTime && (
          <>
            <Text>CPU: {cpuTime.toFixed(0)} ms </Text>
            <Tag color={cpuLevel[0]}>{cpuLevel[1]}</Tag>
            <br />
          </>
        )}

        {fps && (
          <>
            <Text>FPS: {fps} </Text>
            <Tag color={fpsLevel[0]}>{fpsLevel[1]}</Tag>
            <br />
          </>
        )}


       
      </Card>
    </div>
  );
};

const styles = {
  container: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    width: 190,
    backdropFilter: "blur(6px)",
    background: "rgba(255,255,255,0.85)",
    borderRadius: 10,
  },
};

export default SystemBenchMark;