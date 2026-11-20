export function requestPageTurn(element) {
  element.animate(
    [
      { transform: "rotateY(0deg)", opacity: 1 },
      { transform: "rotateY(-2deg)", opacity: .94 },
      { transform: "rotateY(0deg)", opacity: 1 }
    ],
    { duration: 260, easing: "ease-out" }
  );
}