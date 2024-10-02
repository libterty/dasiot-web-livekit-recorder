import React, { useState, useCallback } from "react";
import {
  LiveKitRoom,
  VideoTrack,
  useRoomContext,
  useTracks,
  TrackReference,
} from "@livekit/components-react";
import {
  Track,
  RemoteTrackPublication,
  RemoteParticipant,
  RemoteTrack,
} from "livekit-client";
import { AccessToken } from "livekit-server-sdk";

const serverUrl = import.meta.env.VITE_LIVEKIT_URL as string;

if (!serverUrl) {
  throw new Error("VITE_LIVEKIT_URL is not set");
}

const App: React.FC = () => {
  const [token, setToken] = useState("");
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchToken = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!roomName.trim()) {
        setError("Please enter a room name.");
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        // important!!!
        // don't expose api key and secret on production
        // get token from server instead for production, this is demo only
        const at = new AccessToken(
          import.meta.env.VITE_LIVEKIT_API_KEY,
          import.meta.env.VITE_LIVEKIT_API_SECRET,
          {
            identity: "anl",
          }
        );
        at.addGrant({ roomJoin: true, room: roomName });

        const token = await at.toJwt();
        setToken(token);
      } catch (err) {
        console.error("Error fetching token:", err);
        setError("Failed to fetch token. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [roomName]
  );

  if (!token) {
    return (
      <div>
        <h2>Enter Room Name to Watch Stream</h2>
        <form onSubmit={fetchToken}>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Joining..." : "Join Room"}
          </button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
    );
  }

  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect={true}>
      <VideoStreamDisplay />
    </LiveKitRoom>
  );
};

const isTrackReference = (track: any): track is TrackReference => {
  return "participant" in track && "publication" in track;
};

const VideoStreamDisplay: React.FC = () => {
  const room = useRoomContext();
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  React.useEffect(() => {
    const handleTrackSubscribed = (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      participant: RemoteParticipant
    ) => {
      console.log("New track subscribed:", publication.trackSid);
    };

    room.on("trackSubscribed", handleTrackSubscribed);

    return () => {
      room.off("trackSubscribed", handleTrackSubscribed);
    };
  }, [room]);

  return (
    <div style={{ height: "100vh", overflowY: "auto" }}>
      {tracks.length === 0 ? (
        <div>Waiting for video stream...</div>
      ) : (
        tracks.map((trackReference, index) => {
          if (
            isTrackReference(trackReference) &&
            trackReference.publication.kind === Track.Kind.Video
          ) {
            return (
              <div
                key={trackReference.publication.trackSid || `video-${index}`}
                style={{ marginBottom: "10px" }}
              >
                <VideoTrack trackRef={trackReference} />
              </div>
            );
          } else {
            return (
              <div
                key={`placeholder-${index}`}
                style={{
                  marginBottom: "10px",
                  padding: "10px",
                  background: "#f0f0f0",
                }}
              >
                {isTrackReference(trackReference)
                  ? `Non-video track: ${trackReference.publication.kind}`
                  : "Wait video source"}
              </div>
            );
          }
        })
      )}
    </div>
  );
};

export default App;
