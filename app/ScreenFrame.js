export default function ScreenFrame({ screen }) {
  return (
    <iframe
      title={`Bhasha Bloom ${screen} screen`}
      src={`/stitch/${screen}.html?v=20261115-landing-navbar-size-2`}
      style={{ border: 0, display: "block", height: "100dvh", inset: 0, position: "fixed", width: "100vw" }}
    />
  );
}
