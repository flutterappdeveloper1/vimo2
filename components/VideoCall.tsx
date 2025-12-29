import React, { useEffect, useRef, useState } from 'react';
import { rtdb } from '../services/firebase';
import { ref, set, onValue, push, remove } from 'firebase/database';
import { UserProfile } from '../types';
import { Icons } from './Icons';

interface VideoCallProps {
  currentUser: UserProfile;
  targetUser: UserProfile;
  onClose: () => void;
  isCaller: boolean;
}

const SERVERS = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
};

export const VideoCall: React.FC<VideoCallProps> = ({ currentUser, targetUser, onClose, isCaller }) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [status, setStatus] = useState<string>('Initializing...');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Generate a unique call ID based on UIDs (sorted to ensure consistency)
  const callId = [currentUser.uid, targetUser.uid].sort().join('_');
  const callRef = ref(rtdb, `calls/${callId}`);

  useEffect(() => {
    const startCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        peerConnection.current = new RTCPeerConnection(SERVERS);

        stream.getTracks().forEach((track) => {
          if (peerConnection.current) {
            peerConnection.current.addTrack(track, stream);
          }
        });

        peerConnection.current.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // ICE Candidate handling
        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            const candidatesRef = ref(rtdb, `calls/${callId}/${isCaller ? 'callerCandidates' : 'calleeCandidates'}`);
            push(candidatesRef, event.candidate.toJSON());
          }
        };

        if (isCaller) {
          setStatus('Calling...');
          const offer = await peerConnection.current.createOffer();
          await peerConnection.current.setLocalDescription(offer);
          
          await set(ref(rtdb, `calls/${callId}/offer`), {
            sdp: offer.sdp,
            type: offer.type,
          });
        }

        // Listen for changes in DB
        const offerRef = ref(rtdb, `calls/${callId}/offer`);
        const answerRef = ref(rtdb, `calls/${callId}/answer`);
        const remoteCandidatesRef = ref(rtdb, `calls/${callId}/${isCaller ? 'calleeCandidates' : 'callerCandidates'}`);

        if (!isCaller) {
          setStatus('Connecting...');
          onValue(offerRef, async (snapshot) => {
            const data = snapshot.val();
            if (data && !peerConnection.current?.currentRemoteDescription) {
              const offerDescription = new RTCSessionDescription(data);
              await peerConnection.current?.setRemoteDescription(offerDescription);
              
              const answer = await peerConnection.current?.createAnswer();
              await peerConnection.current?.setLocalDescription(answer!);

              await set(ref(rtdb, `calls/${callId}/answer`), {
                sdp: answer?.sdp,
                type: answer?.type,
              });
            }
          });
        } else {
           onValue(answerRef, (snapshot) => {
             const data = snapshot.val();
             if (data && !peerConnection.current?.currentRemoteDescription) {
               const answerDescription = new RTCSessionDescription(data);
               peerConnection.current?.setRemoteDescription(answerDescription);
               setStatus('Connected');
             }
           });
        }

        onValue(remoteCandidatesRef, (snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const candidate = new RTCIceCandidate(childSnapshot.val());
            peerConnection.current?.addIceCandidate(candidate);
          });
        });

      } catch (err) {
        console.error("Error starting call:", err);
        setStatus('Error accessing media devices.');
      }
    };

    startCall();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      // Remove call data if caller hangs up (optional strategy)
      // remove(callRef); 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsCameraOff(!isCameraOff);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 text-white z-10">
        <h2 className="text-xl font-bold">{targetUser.displayName}</h2>
        <p className="text-sm opacity-80">{status}</p>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        {/* Remote Video (Fullscreen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (PIP) */}
        <div className="absolute bottom-24 right-4 w-32 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-6">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white transition`}
        >
          {isMuted ? <Icons.MicOff /> : <Icons.Mic />}
        </button>
        
        <button
          onClick={onClose}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition transform hover:scale-110"
        >
          <Icons.Phone className="transform rotate-[135deg]" />
        </button>

        <button
          onClick={toggleCamera}
          className={`p-4 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'} text-white transition`}
        >
          {isCameraOff ? <Icons.CameraOff /> : <Icons.Camera />}
        </button>
      </div>
    </div>
  );
};
