const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

export default function GemIcon({ className = 'w-4 h-4' }) {
  return (
    <img
      src="https://media.db.com/images/public/6a099ea78cf8bfef98f1b03d/9dcad51e4_gem.png"
      alt="gem"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}