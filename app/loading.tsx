// app/loading.tsx
//
// 서버에서 데이터를 가져오는 동안 보여줄 화면.
// 파일을 이 이름으로 두기만 하면 Next.js가 알아서 쓴다. 따로 연결할 필요가 없다.
//
// 이게 없으면 느린 네트워크에서 화면이 멈춘 것처럼 보인다.

export default function Loading() {
  return <p className="empty">불러오는 중…</p>;
}
