
function recordAnalyticsEvent(eventType, eventData)
{
  if(window.umami !== undefined)
  {
    window.umami.track(eventType, eventData);
    console.log({eventType, eventData})
  }
}

export {recordAnalyticsEvent};
