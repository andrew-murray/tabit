// Mobile.js

function  isMobile()
{
  // the simple version from
  // https://stackoverflow.com/questions/11381673/detecting-a-mobile-browser
  const userAgent = (navigator.userAgent||navigator.vendor||window.opera);
  const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
  ];

  return toMatch.some((toMatchItem) => {
      return userAgent.match(toMatchItem);
  });
}

export { isMobile };