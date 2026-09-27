
function recordAnalyticsEvent(eventType, eventData)
{
  if(window.umami !== undefined)
  {
    window.umami.track(eventType, eventData);
    console.log("analytics: " + JSON.stringify({eventType, eventData}))
  }
}

export {recordAnalyticsEvent};
