// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@livekit/components-styles'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// const at = new AccessToken(
//   import.meta.env.VITE_LIVEKIT_API_KEY,
//   import.meta.env.VITE_LIVEKIT_API_SECRET,
//   {
//     identity: participantName,
//   }
// );
// at.addGrant({ roomJoin: true, room: roomName });

// const token = await at.toJwt();
// console.log('token: ', token);