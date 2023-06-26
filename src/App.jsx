import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeleteBin2LineIcon from 'remixicon-react/DeleteBin2LineIcon';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Form, Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function ThumbnailsContainer({ videoData }) {
  const getTotal = (data) => {
    const likeCount = parseInt(data.likeCount, 10);
    const viewCount = parseInt(data.viewCount, 10);
    const commentCount = parseInt(data.commentCount, 10);

    return likeCount + viewCount + commentCount;
  };

  const rankedData = videoData.map((data) => ({
    ...data,
    total: getTotal(data),
  }));

  const sortedData = rankedData.sort((a, b) => b.total - a.total);

  return (
    <div className="thumbnails-container">
      {sortedData.map((data, index) => (
        <div key={data.videoId} className="thumbnail-item">
          <img src={data.thumbnail} alt={data.title} />
          <h4>{data.title}</h4>
          <p>Video ID: {data.videoId}</p>
          <p>Views: {data.viewCount}</p>
          <p>Likes: {data.likeCount}</p>
          <p>Comments: {data.commentCount}</p>
          <p>Total: {data.total}</p>
        </div>
      ))}
    </div>
  );
}

function App() {
  const [videoIds, setVideoIds] = useState(['']);
  const apiKey = import.meta.env.VITE_API_KEY;
  const [videoData, setVideoData] = useState([]);
  const [videoIdErrors, setVideoIdErrors] = useState([]);
  const [autoFetch, setAutoFetch] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = videoIds.map(async (videoId) => {
          try {
            const response = await axios.get(
              `https://www.googleapis.com/youtube/v3/videos?part=statistics%2Csnippet&id=${videoId}&key=${apiKey}`
            );

            if (response.data?.items?.[0]?.statistics && response.data?.items?.[0]?.snippet) {
              const { viewCount, likeCount, commentCount } = response.data.items[0].statistics;
              const { title, thumbnails } = response.data.items[0].snippet;

              return {
                videoId,
                viewCount,
                likeCount,
                commentCount,
                title,
                thumbnail: thumbnails?.medium?.url,
              };
            } else {
              throw new Error('Invalid response data');
            }
          } catch (error) {
            return null;
          }
        });

        const videoDataItems = await Promise.all(requests);
        setVideoData(videoDataItems.filter((data) => data !== null));
        setVideoIdErrors((prevErrors) =>
          prevErrors.map((error, index) => (videoDataItems[index] ? '' : 'Invalid video ID'))
        );
      } catch (error) {
        console.error('Error fetching video data:', error);
      }
    };

    if (videoIds.length > 0 && autoFetch) {
      fetchData();
    }
  }, [videoIds, apiKey, autoFetch]);

  useEffect(() => {
    let timerId;

    if (autoFetch) {
      timerId = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);
    }

    return () => {
      clearInterval(timerId);
    };
  }, [autoFetch]);

  useEffect(() => {
    if (countdown === 0) {
      setCountdown(10);
      handleFetchData();
    }
  }, [countdown]);

  const handleFetchData = () => {
    const nonEmptyVideoIds = videoIds.filter((videoId) => videoId.trim() !== '');

    if (nonEmptyVideoIds.length === 0) {
      toast.error('Please enter at least one Video ID');
      return;
    }

    setVideoData([]); // Clear previous data
    setVideoIds(nonEmptyVideoIds);
    setVideoIdErrors([]);
    setAutoFetch(true);
  };

  const handleVideoIdChange = (index, value) => {
    const updatedVideoIds = [...videoIds];
    updatedVideoIds[index] = value;
    setVideoIds(updatedVideoIds);
  };

  const handleAddVideoId = () => {
    setVideoIds([...videoIds, '']);
    setVideoIdErrors([...videoIdErrors, '']);
  };

  const handleRemoveVideoId = (index) => {
    const updatedVideoIds = videoIds.filter((_, i) => i !== index);
    setVideoIds(updatedVideoIds);

    const updatedVideoData = videoData.filter((_, i) => i !== index);
    setVideoData(updatedVideoData);

    const updatedVideoIdErrors = videoIdErrors.filter((_, i) => i !== index);
    setVideoIdErrors(updatedVideoIdErrors);
  };

  return (
    <Container className="app-container">
      <div className="header">
        <h1>YouTube Video Counter and Comparison</h1>
      </div>
      <div className="form-container">
        {videoIds.map((videoId, index) => (
          <Form.Group className="input-group" key={index}>
            <Form.Label>Video ID {index + 1}:</Form.Label>
            <Form.Control
              type="text"
              value={videoId}
              onChange={(event) => handleVideoIdChange(index, event.target.value)}
            />
            {videoIdErrors[index] && <p className="error-message">{videoIdErrors[index]}</p>}
            {index > 0 && (
              <Button variant="danger" onClick={() => handleRemoveVideoId(index)} className="delete-button">
                <DeleteBin2LineIcon size={16} />
              </Button>
            )}
          </Form.Group>
        ))}
        <div className="button-group">
          <Button variant="primary" onClick={handleAddVideoId}>Add Video ID</Button>
          <Button variant="success" onClick={handleFetchData}>Fetch Data</Button>
        </div>
      </div>
      <br/>
      {autoFetch && <p className='countdown'>Next fetch in: {countdown} seconds</p>}
      <ThumbnailsContainer videoData={videoData} />
      <ToastContainer />
    </Container>
  );
}

export default App;
