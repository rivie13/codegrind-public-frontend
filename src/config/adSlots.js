/**
 * Ad slot IDs for Google AdSense
 * 
 * For development, these can be any values since we're using test mode
 * For production, these must be the actual slot IDs from Google AdSense
 */

export const adSlots = {
  home: {
    top: '5056340385',
    sidebar: '6250002558',
    bottom: '9351579126'
  },
  problemList: {
    top: '7786517072',
    sidebar: '9997675873',
    bottom: '1062025568'
  },
  gamesLanding: {
    top: '7846925762',
    sidebar: '8233237873',
    bottom: '4262203272'
  },
  profileDashboard: {
    top: '6888366616',
    sidebar: '8684594201',
    bottom: '8693103571'
  },
  problemWorkspace: {
    top: '3275854625',
    sidebar: '4581269437',
    bottom: '8694327510'
  },
  generic: {
    top: '7244290532',
    sidebar: '7786515313',
    bottom: '6920156206'
  },
  profile: {
    top: '1357924680',
    sidebar: '2468013579',
    bottom: '3691258047'
  },
  // Video ad slots - create these in your AdSense console
  // For now we'll use existing slots but you'll want to create dedicated ones
  video: {
    inArticle: '9245617391', // Replace with a video-enabled ad unit when available
    inFeed: '5306372387'    // Replace with a video-enabled ad unit when available
  },
  // Interactive ad slots
  interactive: {
    autorelaxed: '6250002558' // Replace with a properly configured interactive ad unit
  }
};

// Special slot for modal ads (chat limit popups)
export const modalAdSlot = '9245617391'; // Use a dedicated slot for better performance

export default adSlots; 