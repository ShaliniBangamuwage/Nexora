// Canonical Firebase Web SDK exports. All legacy imports resolve through this
// module so the application uses one Firebase initialization and one config.
export {
  analytics,
  auth,
  db,
  getAuthHeaders,
  storage,
} from '../services/firebase';