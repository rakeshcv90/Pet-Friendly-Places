// Works out the exact size and position of a picture inside a box, so a picture can be drawn at a
// known size instead of relying on the phone's own "cover" / "contain" handling.
//
//  ratio  width / height of the picture itself
//  mode   'cover'   fill the whole box, cropping whatever sticks out (nothing is left empty)
//         'contain' show the whole picture inside the box (there may be empty space around it)
//
// The result is centred in the box: left and top are negative when the picture is bigger than it.
export const fitSize = (ratio, boxWidth, boxHeight, mode) => {
  const boxRatio = boxWidth / boxHeight;
  const fillWidth = mode === 'cover' ? boxRatio > ratio : boxRatio <= ratio;
  const width = fillWidth ? boxWidth : boxHeight * ratio;
  const height = fillWidth ? boxWidth / ratio : boxHeight;
  return {
    width,
    height,
    left: (boxWidth - width) / 2,
    top: (boxHeight - height) / 2,
  };
};
