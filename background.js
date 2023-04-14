chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if(changeInfo.status === 'complete' && /^http/.test(tab.url)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ["./showPerformanceLevel.js"]
    })
      .then(() => {
        console.log("Performance levels showing in the page");
      })
      .catch(err => console.log(err));
  }
});