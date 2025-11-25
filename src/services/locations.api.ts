import {IItem, ILocation, IReview} from '../common/types';
import {request} from './axios';

export type GetLocationsResponse = {
  list: ILocation[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
    isFirstPage?: boolean;
    isLastPage?: boolean;
  };
};

export type GetItemsResponse = {
  list: IItem[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
  };
};

export type GetReviewsResponse = {
  list: IReview[];
  pageInfo: {
    totalRows: number;
    page: number;
    pageSize: number;
  };
};

export const URL_GET_LOCATIONS = '/api/v2/tables/mfz84cb0t9a84jt/records'; // NocoDB Base_Locations Table
export const URL_GET_ITEMS = '/api/v2/tables/m0s4uwjesun4rl9/records'; // Items - chưa setup
// Reviews nằm TRONG bảng Locations (field 'reviews' với ID 'c6dl7ge9cr1azqk')
// Không cần URL_REVIEWS riêng vì reviews là field trong Locations

// NocoDB Storage API - Upload file chung (không cần table ID)
export const URL_UPLOAD = '/api/v2/storage/upload'; // NocoDB Storage API

const locationApi = {
  getLocations: async () => {
    // 🔍 DEBUG: Log API request details
    console.log('========================================');
    console.log('🔍 DEBUG: getLocations() - FETCHING ALL PAGES');
    console.log(`📡 API URL: ${URL_GET_LOCATIONS}`);
    console.log('========================================');

    // ✨ PAGINATION FIX: NocoDB enforces max pageSize of 100
    // We need to fetch all pages to get all locations
    let allData: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;
    const pageSize = 100; // NocoDB's max page size

    while (hasMorePages) {
      const offset = (currentPage - 1) * pageSize;

      console.log(`📄 Fetching page ${currentPage} (offset: ${offset}, limit: ${pageSize})...`);

      const res = await request.get<GetLocationsResponse>(URL_GET_LOCATIONS, {
        params: {
          offset: offset.toString(),
          limit: pageSize.toString(),
        },
      });

      const pageData = res.data.list ?? [];
      allData = allData.concat(pageData);

      console.log(`   ✅ Page ${currentPage}: ${pageData.length} records`);
      console.log(`   📊 Total so far: ${allData.length} records`);

      // Check if there are more pages
      const pageInfo = res.data.pageInfo;
      hasMorePages = !pageInfo.isLastPage && pageData.length === pageSize;

      if (hasMorePages) {
        currentPage++;
      }
    }

    let data = allData;

    // 🔍 DEBUG: Log total locations fetched from NocoDB
    console.log('========================================');
    console.log('🔍 DEBUG: getLocations() - ALL PAGES FETCHED');
    console.log(`📊 Total locations fetched from NocoDB: ${data.length}`);
    console.log(`� Total pages fetched: ${currentPage}`);
    console.log('========================================');

    // Parse JSON fields từ NocoDB
    data = data.map(location => {
      const parsed: any = {
        ...location,
      };

      // Parse reviews (luôn là JSON string từ NocoDB)
      if (typeof location.reviews === 'string') {
        try {
          parsed.reviews = JSON.parse(location.reviews);
        } catch (e) {
          console.error('Error parsing reviews:', e);
          parsed.reviews = [];
        }
      }

      // Parse images (có thể là JSON string từ NocoDB)
      if (typeof location.images === 'string') {
        try {
          parsed.images = JSON.parse(location.images);
        } catch (e) {
          console.error('Error parsing images:', e);
          parsed.images = [];
        }
      }

      // Parse videos (có thể là JSON string từ NocoDB)
      if (typeof location.videos === 'string') {
        try {
          parsed.videos = JSON.parse(location.videos);
        } catch (e) {
          console.error('Error parsing videos:', e);
          parsed.videos = [];
        }
      }

      // Parse advise (có thể là JSON string từ NocoDB)
      if (typeof location.advise === 'string') {
        try {
          // Thử parse JSON trước
          parsed.advise = JSON.parse(location.advise);
        } catch (e) {
          // Nếu không phải JSON, giữ nguyên string
          parsed.advise = location.advise;
        }
      }

      // Parse types (có thể là JSON string từ NocoDB)
      if (typeof (location as any).types === 'string') {
        try {
          parsed.types = JSON.parse((location as any).types);
          console.log(`✅ Parsed types for "${parsed.name}":`, parsed.types);
        } catch (e) {
          console.error('Error parsing types:', e);
          parsed.types = [];
        }
      } else if (Array.isArray((location as any).types)) {
        // Nếu đã là array, copy trực tiếp
        parsed.types = (location as any).types;
        console.log(`✅ Types already array for "${parsed.name}":`, parsed.types);
      } else {
        console.log(`⚠️ No types field for "${parsed.name}"`);
      }

      // ✨ AUTO-GENERATE AVATAR: Lấy ảnh đầu tiên từ mảng images làm avatar
      // Nếu không có trường avatar hoặc avatar rỗng, tự động lấy ảnh đầu tiên
      if (!parsed.avatar || parsed.avatar === '') {
        if (parsed.images && Array.isArray(parsed.images) && parsed.images.length > 0) {
          parsed.avatar = parsed.images[0];
          console.log(`✅ Auto-set avatar for "${parsed.name}": ${parsed.avatar}`);
        } else {
          // Fallback: nếu không có images, set avatar rỗng
          parsed.avatar = '';
          console.log(`⚠️ No images available for "${parsed.name}", avatar set to empty`);
        }
      }

      // ✨ MARKER FIELD: Handle marker field for map visibility
      // Default to true for backward compatibility (existing locations without marker field)
      if (typeof (location as any).marker === 'boolean') {
        parsed.marker = (location as any).marker;
      } else if (typeof (location as any).marker === 'string') {
        // Handle string values (e.g., "true", "false", "1", "0")
        parsed.marker = (location as any).marker === 'true' || (location as any).marker === '1';
      } else {
        // Default to true if marker field is missing (for existing locations)
        parsed.marker = true;
      }

      return parsed;
    });

    // 🔍 DEBUG: Log marker field statistics
    const markerTrueCount = data.filter(loc => loc.marker === true).length;
    const markerFalseCount = data.filter(loc => loc.marker === false).length;
    const markerUndefinedCount = data.filter(loc => loc.marker === undefined).length;

    console.log('========================================');
    console.log('🔍 DEBUG: Marker field statistics');
    console.log(`✅ marker=true: ${markerTrueCount} locations`);
    console.log(`❌ marker=false: ${markerFalseCount} locations`);
    console.log(`⚠️  marker=undefined: ${markerUndefinedCount} locations`);
    console.log(`📊 Total after parsing: ${data.length} locations`);

    // Show sample locations with marker=false
    const sampleHiddenLocations = data.filter(loc => loc.marker === false).slice(0, 5);
    if (sampleHiddenLocations.length > 0) {
      console.log('🏨 Sample locations with marker=false:');
      sampleHiddenLocations.forEach((loc, idx) => {
        console.log(`   ${idx + 1}. ${loc.name} (marker=${loc.marker})`);
      });
    } else {
      console.log('⚠️  WARNING: No locations with marker=false found!');
    }
    console.log('========================================');

    return data;
  },

  getItems: async () => {
    const res = await request.get<GetItemsResponse>(URL_GET_ITEMS, {
      params: {
        offset: '0',
        limit: '100',
      },
    });
    const data = res.data.list ?? [];
    return data;
  },

  getItemsWithLocationId: async (locationId: number) => {
    const res = await request.get<GetItemsResponse>(URL_GET_ITEMS, {
      params: {
        offset: '0',
        limit: '100',
        // filterByFormula: `FIND('${locationId}', {location})`,
      },
    });
    let data = res.data.list ?? [];

    data = data.filter(
      item => item.location && item.location?.Id === locationId,
    );

    // return data.filter(item => item.location?.Id === locationId);
    return data;
  },

  /**
   * Get all reviews from NocoDB
   * Reviews nằm trong field 'reviews' của bảng Locations
   */
  getReviews: async () => {
    try {
      // Lấy tất cả locations với reviews
      const locations = await locationApi.getLocations();

      // Extract tất cả reviews từ locations
      let allReviews: IReview[] = [];
      locations.forEach(location => {
        if (location.reviews && Array.isArray(location.reviews)) {
          // Gắn location vào mỗi review và parse images nếu cần
          const reviewsWithLocation = location.reviews.map(review => {
            const parsedReview = {...review};

            // Parse images nếu là JSON string
            if (parsedReview.images && typeof parsedReview.images === 'string') {
              try {
                parsedReview.images = JSON.parse(parsedReview.images);
              } catch (e) {
                console.error('Error parsing review images:', e);
                parsedReview.images = [];
              }
            }

            // Gắn location
            parsedReview.location = location;

            return parsedReview;
          });
          allReviews = allReviews.concat(reviewsWithLocation);
        }
      });

      console.log('✅ Total reviews from cloud:', allReviews.length);

      // Debug: Log reviews with images
      const reviewsWithImages = allReviews.filter(r => r.images && r.images.length > 0);
      console.log('📸 Reviews with images count:', reviewsWithImages.length);
      if (reviewsWithImages.length > 0) {
        console.log('📸 Sample review with images:', {
          id: reviewsWithImages[0].id,
          content: reviewsWithImages[0].content?.substring(0, 30) + '...',
          images: reviewsWithImages[0].images,
          imagesType: typeof reviewsWithImages[0].images,
          imagesIsArray: Array.isArray(reviewsWithImages[0].images),
        });
      }

      return allReviews;
    } catch (error) {
      console.error('❌ Error fetching reviews:', error);
      return [];
    }
  },

  /**
   * Create a new review
   * Reviews nằm trong field 'reviews' của Location, nên cần:
   * 1. Lấy location hiện tại
   * 2. Thêm review mới vào array reviews
   * 3. Update location với reviews mới
   */
  createReview: async (review: Partial<IReview>) => {
    try {
      const locationId = review.location?.Id || review.location?.id;
      if (!locationId) {
        throw new Error('Location ID is required');
      }

      console.log('📝 Creating review for location:', locationId);

      // 1. Lấy location hiện tại
      console.log('📥 Fetching location:', `${URL_GET_LOCATIONS}/${locationId}`);
      const res = await request.get(`${URL_GET_LOCATIONS}/${locationId}`);
      const location = res.data;
      console.log('✅ Location fetched:', location.name || location.Name);

      // 2. Parse reviews hiện tại
      let currentReviews: any[] = [];
      if (location.reviews) {
        if (typeof location.reviews === 'string') {
          try {
            currentReviews = JSON.parse(location.reviews);
          } catch (e) {
            console.error('Error parsing current reviews:', e);
            currentReviews = [];
          }
        } else if (Array.isArray(location.reviews)) {
          currentReviews = location.reviews;
        }
      }
      console.log('📋 Current reviews count:', currentReviews.length);

      // 3. Thêm review mới (không bao gồm location để tránh circular reference)
      const newReview = {
        id: review.id,
        content: review.content,
        name_user_review: review.name_user_review,
        time_review: review.time_review,
        start: review.start,
        avatar: review.avatar,
        images: review.images || [], // Giữ nguyên array, sẽ stringify khi lưu vào NocoDB
      };
      currentReviews.push(newReview);
      console.log('📋 New reviews count:', currentReviews.length);
      console.log('📸 New review images:', newReview.images);

      // 4. Update location với reviews mới
      // NocoDB PATCH endpoint: /api/v2/tables/{tableId}/records
      // Body phải là array: [{Id: ..., field: ...}]

      const updateUrl = URL_GET_LOCATIONS;
      const updatePayload = [
        {
          Id: locationId, // Primary key field (viết hoa)
          reviews: JSON.stringify(currentReviews),
        }
      ];

      console.log('📤 Updating location:', updateUrl);
      console.log('📤 Payload:', JSON.stringify(updatePayload).substring(0, 200) + '...');

      const updateRes = await request.patch(updateUrl, updatePayload);

      console.log('✅ Review added to location:', locationId);
      console.log('✅ Update response:', updateRes.data);
      return updateRes.data;
    } catch (error: any) {
      console.error('❌ Error creating review:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw error;
    }
  },

  /**
   * Upload image to NocoDB Storage
   * @param file File object from image picker
   * @returns Object with url/path of uploaded image
   */
  uploadImage: async (file: any) => {
    try {
      const formData = new FormData();

      // NocoDB expects 'files' (plural) as field name
      formData.append('files', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.fileName || `photo_${Date.now()}.jpg`,
      } as any);

      console.log('📤 Uploading to:', URL_UPLOAD);
      console.log('📤 File info:', {
        uri: file.uri,
        type: file.type,
        name: file.fileName,
      });

      const res = await request.post(URL_UPLOAD, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Image uploaded:', res.data);

      // NocoDB trả về array of uploaded files
      // Format: [{ url: "...", signedUrl: "...", title: "...", mimetype: "...", size: ... }]
      // ⚠️ QUAN TRỌNG: Phải dùng signedUrl thay vì url để tránh 403 Forbidden
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const uploadedFile = res.data[0];
        console.log('📸 Uploaded file details:', {
          url: uploadedFile.url,
          signedUrl: uploadedFile.signedUrl,
          title: uploadedFile.title,
        });

        return {
          // Dùng signedUrl (có quyền truy cập) thay vì url (private)
          url: uploadedFile.signedUrl || uploadedFile.url,
          title: uploadedFile.title,
        };
      }

      throw new Error('Upload response invalid');
    } catch (error: any) {
      console.error('❌ Error uploading image:', error);
      console.error('❌ Error details:', error.response?.data);
      throw error;
    }
  },

  /**
   * Calculate average rating for a location
   */
  calculateAverageRating: (reviews: IReview[]): number => {
    if (!reviews || reviews.length === 0) {
      return 0;
    }
    const total = reviews.reduce((sum, review) => sum + (review.start || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  },
};
export default locationApi;
