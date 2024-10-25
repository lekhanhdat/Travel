import { icon_camera } from "../assets/ImageSvg";
import images from "../res/images";
import { ILocation } from "./types";

export const LOCATION_POPULAR: ILocation[] = [
  // {
  //   id: 3,
  //   name: 'DEV_LOCATION',
  //   avatar: 'https://banahills.sunworld.vn/wp-content/uploads/2024/04/DJI_0004-1536x879.jpg',
  //   address: 'Thôn An Sơn, xã Hòa Ninh, huyện Hòa Vang, TP. Đà Nẵng, Việt Nam',
  //   description: 'Nằm ở độ cao 1.487m so với mực nước biển, Sun World Ba Na Hills được mênh danh là “chốn bồng lai tiên cảnh”, sở hữu khí hậu tuyệt vời cùng cảnh quan thiên nhiên kỳ thú. Đến với Sun World Ba Na Hills để trải nghiệm khí hậu 4 mùa trong một ngày cùng nhiều hoạt động lễ hội, vui chơi giải trí, ẩm thực hấp dẫn đa dạng.',
  //   lat: 20.99943765883785,
  //   long: 105.75394391643286,
  //   reviews: [
  //     {
  //       id: 1,
  //       content: 'Cảnh quan nơi đây trên cả mong đợi, khung cảnh thiên nhiên hùng vĩ và không khí trong lành.',
  //       name_user_review: 'Ngô Châu Bảo Khanh',
  //       time_review: '1/10/2024 13:45',
  //       start: 5,
  //       avatar: ' https://ss-images.saostar.vn/wwebp1200/pc/1613810558698/Facebook-Avatar_3.png'
  //     },
  //     {
  //       id: 3,
  //       content: ' Mình thắc mắc tại sao nơi đây vẫn chưa được mệnh danh là thiên đường ẩm thực nhỉ, dường như sơn hào hải vị trên thế gian đều có thể được tìm thấy ở đây ấy',
  //       name_user_review: 'Ngô Ngọc Hoàng Vương',
  //       time_review: '1/7/2024  9:28',
  //       start: 5,
  //       avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg'
  //     },
  //     {
  //       id: 5,
  //       content: ' Tôi rất hứng thú với nền văn hóa nơi đây, đa dạng và mang đậm bản sắc người Việt',
  //       name_user_review: 'Châu Thị Diễm',
  //       time_review: ' 10/2/2024 20:08',
  //       start: 5,
  //       avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg'
  //     },
  //     {
  //       id: 7,
  //       content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
  //       name_user_review: 'Ngô Ngọc Hoàng Vương',
  //       time_review: '9/10/2024 23:08',
  //       start: 5,
  //       avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg'
  //     },
  //     {
  //       id: 9,
  //       content: 'Amazing!!, I love it !!',
  //       name_user_review: 'John Peterson',
  //       time_review: '30/9/2024 11:44',
  //       start: 5,
  //       avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg'
  //     },
  //   ],
  //   haveVoice: true,
  // },
  {
    id: 3,
    name: 'Khu du lịch Bà Nà – Núi Chúa',
    avatar: 'https://banahills.sunworld.vn/wp-content/uploads/2024/04/DJI_0004-1536x879.jpg',
    address: 'Thôn An Sơn, xã Hòa Ninh, huyện Hòa Vang, TP. Đà Nẵng, Việt Nam',
    description: 'Nằm ở độ cao 1.487m so với mực nước biển, Sun World Ba Na Hills được mênh danh là “chốn bồng lai tiên cảnh”, sở hữu khí hậu tuyệt vời cùng cảnh quan thiên nhiên kỳ thú. Đến với Sun World Ba Na Hills để trải nghiệm khí hậu 4 mùa trong một ngày cùng nhiều hoạt động lễ hội, vui chơi giải trí, ẩm thực hấp dẫn đa dạng.',
    lat: 15.995321427046978,
    long: 107.99614932444008,
    reviews: [
      {
        id: 1,
        content: 'Cảnh quan nơi đây trên cả mong đợi, khung cảnh thiên nhiên hùng vĩ và không khí trong lành.',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: '1/10/2024 13:45',
        start: 5,
        avatar: 'https://ss-images.saostar.vn/wwebp1200/pc/1613810558698/Facebook-Avatar_3.png'
      },
      {
        id: 3,
        content: 'Mình thắc mắc tại sao nơi đây vẫn chưa được mệnh danh là thiên đường ẩm thực nhỉ, dường như sơn hào hải vị trên thế gian đều có thể được tìm thấy ở đây ấy',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '1/7/2024  9:28',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg'
      },
      {
        id: 5,
        content: 'Tôi rất hứng thú với nền văn hóa nơi đây, đa dạng và mang đậm bản sắc người Việt',
        name_user_review: 'Châu Thị Diễm',
        time_review: ' 10/2/2024 20:08',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg'
      },
      {
        id: 7,
        content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '9/10/2024 23:08',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg'
      },
      {
        id: 9,
        content: 'Amazing!!, I love it !!',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg'
      },
    ],
    haveVoice: true,
    voiceName: 'warning',
    images: [
      'https://banahills.sunworld.vn/wp-content/uploads/2024/04/DJI_0004-1536x879.jpg'
    ],
    videos: [
      'https://www.youtube.com/watch?v=abPmZCZZrFA'
    ]
  },
  {
    id: 4,
    name: 'Bãi biển Mỹ Khê',
    avatar: 'https://dichoithoi.com/diem-den/bien-my-khe.jpg',
    address: 'Đường Võ Nguyên Giáp, phường Phước Mỹ, quận Sơn Trà, TP. Đà Nẵng, Việt Nam',
    description: 'Bãi biển Mỹ Khê Đà Nẵng với cảnh quan thiên nhiên xinh đẹp, hùng vĩ từng được Forbes - Tạp chí kinh tế hàng đầu của Mỹ - Bình chọn là một trong Top 6 bãi biển quyến rũ nhất hành tinh. Đây chính là trung tâm của mọi cuộc vui chơi, giải trí. Đến với bãi biển Mỹ Khê, du khách sẽ được hòa mình vào một kì nghỉ dưỡng tuyệt vời và đầy những điều thú vị.',
    lat: 16.064512572481316,
    long: 108.2469544913733,
    reviews: [
      {
        id: 11,
        content: 'quite expensive but worthwhile :P',
        name_user_review: 'William',
        time_review: '13/5/2024 16:30',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/02/25/trend-avatar-6.jpg'
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
      {
        id: 19,
        content: ' Suitable for those who like to travel !!',
        name_user_review: ' Liz',
        time_review: '28/9/2023 17:09',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-11.jpg '
      },
    ]
  },
  {
    id: 6,
    name: 'Phố cổ Hội An',
    avatar: 'https://toquoc.mediacdn.vn/280518851207290880/2023/8/17/53703063-5989-4005-b5de-7ef567181d86d2fd0929-16922414873551394557686.jpg',
    address: 'Phường Minh An, Hội An, Quảng Nam, Việt Nam',
    description: 'Phố cổ Hội An là một thành phố nổi tiếng của tỉnh Quảng Nam, một phố cổ giữ được gần như nguyên vẹn với hơn 1000 di tích kiến trúc từ phố xá, nhà cửa, hội quán, đình, chùa, miếu, nhà thờ tộc, giếng cổ… đến các món ăn truyền thống, tâm hồn của người dân nơi đây. Một lần du lịch Hội An sẽ làm say đắm lòng du khách bởi những nét đẹp trường tồn cùng thời gian, vô cùng mộc mạc, bình dị.',
    lat: 15.877457197166912,
    long: 108.3299877606812,
    reviews: [
      {
        id: 21,
        content: ' I love VietNamm <3',
        name_user_review: 'Thomas',
        time_review: '14/5/2024 11: 57',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-6.jpg '
      },
      {
        id: 23,
        content: ' Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: ' Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: ' 黄 贺 江',
        time_review: ' 6/7/2024 7:56 ',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
    ]
  },
  {
    id: 8,
    name: 'Chợ Hàn Đà Nẵng',
    avatar: 'https://bizweb.dktcdn.net/100/006/093/files/cho-han-da-nang.jpg?v=1701743273595',
    address: '119 Trần Phú, phường Hải Châu 1, quận Hải Châu, TP. Đà Nẵng, Việt Nam',
    description: 'Chợ Hàn Đà Nẵng là một trong những ngôi chợ truyền thống lâu đời tại Đà Thành và cho tới nay vẫn thu hút đông đảo du khách đến thăm, chụp hình lưu niệm và mua sắm.',
    lat: 16.06837114929403,
    long: 108.22456501835748,
    reviews: [
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg'
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg'
      },
      {
        id: 26,
        content: 'Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: '20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg'
      },
      {
        id: 28,
        content: 'जिस तरह से यहां के लोग मेरा स्वागत करते हैं वह मुझे पसंद है, वे बहुत दयालु और खुशमिजाज हैं।',
        name_user_review: 'Ajay',
        time_review: '24/3/2024 12:49',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-1.jpg'
      },
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: '黄 贺 江',
        time_review: ' 6/7/2024 7:56',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
    ]
  },
  {
    id: 9,
    name: 'Hot Springs Park - Núi Thần Tài',
    avatar: 'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1200,h_630/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/hsnmkdasrhwmvng1yrht/V%C3%A9%20C%C3%B4ng%20Vi%C3%AAn%20N%C3%BAi%20Th%E1%BA%A7n%20T%C3%A0i%20%C4%90%C3%A0%20N%E1%BA%B5ng.jpg',
    address: 'Phường Hoà Phú, huyện Hòa Vang, TP. Đà Nẵng, Việt Nam',
    description: 'Nằm tại khu bảo tồn thiên nhiên Bà Nà Núi Chúa, thôn Phú Túc, xã Hòa Phú, huyện Hòa Vang, thành phố Đà Nẵng, Công viên suối khoáng nóng Núi Thần Tài có thể nói là một tuyệt tác mà thiên nhiên ban tặng cho thủ phủ của miền Trung Việt Nam, trải dài trên một diện tích hơn 160 hectare. Giữa thành phố biển nhưng nơi đây lại mang một khí hậu đặc trưng của Bà Nà với 4 mùa trong ngày.',
    lat: 15.968036852390735,
    long: 108.02038465274708,
    reviews: [
      {
        id: 1,
        content: 'Cảnh quan nơi đây trên cả mong đợi, khung cảnh thiên nhiên hùng vĩ và không khí trong lành.',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: '1/10/2024 13:45',
        start: 5,
        avatar: 'https://ss-images.saostar.vn/wwebp1200/pc/1613810558698/Facebook-Avatar_3.png '
      },
      {
        id: 2,
        content: 'Mình thích cái cách người dân nơi đây tiếp đón mình thật sự, họ tử tế và vui vẻ lắm.',
        name_user_review: 'Trần Đình Quý',
        time_review: '23/9/2024 8:32',
        start: 5,
        avatar: 'https://cdn.kona-blue.com/upload/kona-blue_com/post/images/2024/09/18/457/avatar-mac-dinh-1.jpg '
      },
      {
        id: 3,
        content: 'Mình thắc mắc tại sao nơi đây vẫn chưa được mệnh danh là thiên đường ẩm thực nhỉ, dường như sơn hào hải vị trên thế gian đều có thể được tìm thấy ở đây ấy',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '1/7/2024  9:28',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 5,
        content: 'Tôi rất hứng thú với nền văn hóa nơi đây, đa dạng và mang đậm bản sắc người Việt',
        name_user_review: 'Châu Thị Diễm',
        time_review: ' 10/2/2024 20:08',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg '
      },
    ]
  },
  {
    id: 12,
    name: 'Công viên Châu Á - Sun World Asia Park',
    avatar: 'https://cdn3.ivivu.com/2024/01/Asia-Park-ivivu.jpg',
    address: 'Hòa Cường, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Nhắc đến những địa điểm vui chơi hàng đầu Đà Nẵng, chúng ta không thể nào bỏ qua Công Viên Châu Á Đà Nẵng - hay Asia Park Danang. Toạ lạ trên khuôn viên rộng khoảng 800 héc-ta, Công Viên Châu Á Đà Nẵng tái hiện 10 nền văn hoá khác nhau tại Châu Á, mang đến cho bạn những trải nghiệm du lịch và trò chơi đầy cảm xúc. Đó có thể là giây phút “hú hồn” với trò chơi cảm giác mạnh Singapore Sling, thoả thích ngắm cảnh trên tàu điện trên cao hiện đại nhất Việt Nam hay check-in cùng vòng xoay đu quay khổng lồ Sun Wheel.',
    lat: 16.040296195587647,
    long: 108.22659879084512,
    reviews: [
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 7,
        content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '9/10/2024 23:08',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 9,
        content: 'Amazing!!, I love it !! ',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg '
      },
      {
        id: 10,
        content: 'the atmosphere is insane!!',
        name_user_review: 'David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
    ]
  },
  {
    id: 15,
    name: 'Bảo tàng Hồ Chí Minh',
    avatar: 'https://baotanghochiminh.vn/pic/Service/images/BT%20Quan%20khu%205%20(Large).jpg',
    address: '1 Duy Tân, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Việt Nam ',
    description: 'Bảo tàng Hồ Chí Minh Đà Nẵng chính thức đi vào hoạt động vào ngày 19/5/1977, là nơi trưng bày những kỉ vật về cuộc đời và sự nghiệp cách mạng của Bác Hồ, những vật chứng hào hùng trong cuộc đấu tranh bảo vệ Tổ quốc .',
    lat: 16.04881542371627,
    long: 108.21805306438897,
    reviews: [
      {
        id: 11,
        content: 'quite expensive but worthwhile :P',
        name_user_review: 'William',
        time_review: '13/5/2024 16:30',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/02/25/trend-avatar-6.jpg'
      },
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
    ]
  },
  {
    id: 18,
    name: 'Đỉnh Bàn Cờ',
    avatar: 'https://statics.vinpearl.com/dinh-ban-co-2_1629274112.jpg',
    address: 'bán đảo Sơn Trà,  Thọ Quang, Sơn Trà, Đà Nẵng, Việt Nam ',
    description: 'Đỉnh Bàn Cờ là địa điểm du lịch nổi tiếng thu hút du khách không chỉ bởi sự đơn sơ, giản dị, mộc mạc trong văn hoá địa khu mà truyền thuyết lịch sử về nơi đây còn khiến nhiều người thích thú..',
    lat: 16.119132318571843,
    long: 108.27239029137456,
    haveVoice: true,
    reviews: [
      {
        id: 16,
        content: 'ベトナムでの本当に興味深い経験',
        name_user_review: ' Tomoka',
        time_review: '15/12/2023 17:38',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-51.jpg '
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
      {
        id: 18,
        content: ' Cần thêm một vài điểm đột phá để mang lại nhiều trải nghiệm thú vị hơn!!',
        name_user_review: ' Công Mẫn',
        time_review: '3/11/2023',
        start: 3,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-12.jpg'
      },
      {
        id: 19,
        content: ' Suitable for those who like to travel !!',
        name_user_review: ' Liz',
        time_review: '28/9/2023 17:09',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-11.jpg '
      },
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
    ],

  },
  {
    id: 27,
    name: 'Nhà thờ chính tòa Đà Nẵng',
    avatar: 'https://statics.vinpearl.com/nha-tho-con-ga-da-nang-01_1632498684.jpg',
    address: '156 Trần Phú, Hải Châu 1, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Nhà thờ chính tòa hay Nhà thờ Con Gà nằm ngay trung tâm thành phố , thu hút du khách bởi kiến trúc châu Âu cổ kính, độc đáo và vô cùng mới lạ. Nhà thờ Con Gà mang nét đẹp tôn giáo và là điểm đến không thể chối từ dành cho các tín đồ “sống ảo”..',
    lat: 16.066867760389936,
    long: 108.22364684904535,
    reviews: [
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg '
      },
      {
        id: 23,
        content: 'Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: 'Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg'
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 26,
        content: ' Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: ' 20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
    ]
  },
  {
    id: 30,
    name: 'Nhà Trưng bày Hoàng Sa',
    avatar: 'https://danangfantasticity.com/wp-content/uploads/2022/05/nha-trung-bay-hoang-sa-danang-viet-nam-muon-nam-hoang-sa-truong-sa-la-cua-vietnam.jpg',
    address: 'Đường Hoàng Sa, Thọ Quang, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Nhà Trưng bày Hoàng Sa được thành lập vào ngày 08/8/2017,là công trình có ý nghĩa đặc biệt quan trọng, nơi trưng bày, giới thiệu, tuyên truyền những tư liệu lịch sử và pháp lý minh chứng về quá trình khai phá, xác lập và bảo vệ chủ quyền của Việt Nam đối với quần đảo Hoàng Sa một cách thực sự, liên tục và hòa bình, phù hợp với thực tiễn và luật pháp quốc tế..',
    lat: 16.093646135367088,
    long: 108.25228780618957,
    reviews: [
      {
        id: 21,
        content: ' I love VietNamm <3',
        name_user_review: 'Thomas',
        time_review: '14/5/2024 11: 57',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-6.jpg '
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg '
      },
      {
        id: 28,
        content: 'जिस तरह से यहां के लोग मेरा स्वागत करते हैं वह मुझे पसंद है, वे बहुत दयालु और खुशमिजाज हैं।',
        name_user_review: 'Ajay',
        time_review: '24/3/2024 12:49',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-1.jpg '
      },
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: '黄 贺 江',
        time_review: ' 6/7/2024 7:56',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
    ],
    haveVoice: true,
  },
  {
    id: 32,
    name: 'Cầu Rồng',
    avatar: 'https://tiki.vn/blog/wp-content/uploads/2023/03/cau-rong-da-nang.jpg',
    address: 'An Hải Tây, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Cầu Rồng là một trong những công trình biểu tượng của thành phố Đà Nẵng, nổi bật với kiến trúc độc đáo và mang tính biểu tượng văn hóa đặc trưng của Việt Nam. Đây không chỉ là cây cầu nối liền đôi bờ sông Hàn mà còn là một điểm tham quan nổi tiếng thu hút du khách trong và ngoài nước.',
    lat: 16.061480295569883,
    long: 108.22809214904528,
    reviews: [
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
      {
        id: 9,
        content: 'Amazing!!, I love it !! ',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 7,
        content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '9/10/2024 23:08',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg '
      },
    ]
  },
  {
    id: 35,
    name: 'Cầu sông Hàn',
    avatar: 'https://halotravel.vn/wp-content/uploads/2021/07/cau-quay-song-han-1.jpg',
    address: 'Cầu Sông Hàn, An Hải Bắc, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Đưa vào hoạt động năm 2000, địa điểm du lịch Đà Nẵng cầu sông Hàn là niềm tự hào của người dân thành phố. Đây là cây cầu xoay đầu tiên ở Việt Nam, khơi dậy tiềm năng kinh tế, giao thông vận tải, du lịch của thành phố. .',
    lat: 16.0723136647926,
    long: 108.22714740301355,
    reviews: [
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 5,
        content: ' Tôi rất hứng thú với nền văn hóa nơi đây, đa dạng và mang đậm bản sắc người Việt',
        name_user_review: 'Châu Thị Diễm',
        time_review: ' 10/2/2024 20:08',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg '
      },
      {
        id: 1,
        content: 'Cảnh quan nơi đây trên cả mong đợi, khung cảnh thiên nhiên hùng vĩ và không khí trong lành.',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: '1/10/2024 13:45',
        start: 5,
        avatar: ' https://ss-images.saostar.vn/wwebp1200/pc/1613810558698/Facebook-Avatar_3.png '
      },
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
    ]
  },
];

export const LOCATION_NEARLY: ILocation[] = [
    {
    id: 99,
    name: 'Trung tâm văn hóa Quận Sơn Trà',
    avatar: 'https://toquoc.mediacdn.vn/280518851207290880/2024/2/7/t13-17072924281061610153581.jpg',
    address: '02 An Trung 2, An Hải, Sơn Trà, Đà Nẵng 550000, Việt Nam',
    description: 'Nhà văn hóa quận Sơn Trà, Đà Nẵng, là một trung tâm văn hóa cộng đồng quan trọng, đóng vai trò cung cấp các hoạt động văn hóa, nghệ thuật và giải trí cho cư dân trong khu vực. Với mục tiêu phát triển đời sống tinh thần cho người dân, Nhà văn hóa quận Sơn Trà đóng góp quan trọng trong việc nâng cao nhận thức và gắn kết cộng đồng. Đây là nơi diễn ra các hoạt động giao lưu, sinh hoạt văn hóa lành mạnh, giúp cư dân địa phương có cơ hội tham gia vào các hoạt động mang tính giáo dục và giải trí.',
    lat: 16.05619768599021,
    long: 108.23339486724585,
    reviews: [
      {
        id: 2,
        content: 'Mình thích cái cách người dân nơi đây tiếp đón mình thật sự, họ tử tế và vui vẻ lắm.',
        name_user_review: 'Trần Đình Quý',
        time_review: '23/9/2024 8:32',
        start: 5,
        avatar: ' https://cdn.kona-blue.com/upload/kona-blue_com/post/images/2024/09/18/457/avatar-mac-dinh-1.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
    ],
    haveVoice: true,
    images: [
      'https://toquoc.mediacdn.vn/280518851207290880/2024/2/7/t13-17072924281061610153581.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5bCrreS5hu5hNdOY96dlxGldtvgtfsMaDIQ&s',
      'https://hoangtung.com.vn/wp-content/uploads/2019/07/46960613_1789791237814094_2075173698863628288_n.jpg'
    ],
    relatedKeyWord: 'Bao Tang',    
    videos: ['Dh6ilW6Ua0w'],
  },
  {
    id: 98,
    name: 'Trường THPT chuyên Lê Quý Đôn',
    avatar: 'https://docs.portal.danang.gov.vn/images/image/30142036.JPG',
    address: '01 Vũ Văn Dũng, An Hải Tây, Sơn Trà, Đà Nẵng 550000, Việt Nam',
    description: 'Trường Trung học Phổ thông chuyên Lê Quý Đôn, thành phố Đà Nẵng là trường trung học phổ thông chuyên công lập tại Thành phố Đà Nẵng. Mang trong mình sứ mệnh phát hiện và kiến tạo những giá trị ưu việt, trường không ngừng được đầu tư, nâng cao về cơ sở vật chất và chất lượng giảng dạy. Trường THPT Chuyên Lê Quý Đôn Đà Nẵng tự hào là một ngôi trường cấp 3 hàng đầu thành phố với bề dày thành tích đồ sộ, là nơi nuôi dưỡng và trưởng thành của bao thế hệ học trò thành đạt.',
    lat: 16.05732852824048,
    long: 108.23345538952117,
    reviews: [
      {
        id: 2,
        content: 'Mình thích cái cách người dân nơi đây tiếp đón mình thật sự, họ tử tế và vui vẻ lắm.',
        name_user_review: 'Trần Đình Quý',
        time_review: '23/9/2024 8:32',
        start: 5,
        avatar: ' https://cdn.kona-blue.com/upload/kona-blue_com/post/images/2024/09/18/457/avatar-mac-dinh-1.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
    ],
    haveVoice: true,
    images: [
      'https://docs.portal.danang.gov.vn/images/image/30142036.JPG',
      'https://img.giaoduc.net.vn/w1000/Uploaded/2024/uivplwiv/2022_03_22/truong-thpt-chuyen-le-quy-don-da-nang-2496.jpeg',
    ],
    videos: ['VHpp2M7BFg4', 'JRPGdSOyN9w', 'fSjFibPXdw8'],
    relatedKeyWord: 'Bao Tang',
    voiceName: 'warning'
  },
  {
    id: 97,
    name: 'Nhà trưng bày tác phẩm nghệ thuật quận Sơn Trà',
    avatar: 'https://docs.portal.danang.gov.vn/images/images/Nam%202024/Thang%2001/22-1%20NHA%20TRUNG%20BAY%20QUAN%20SON%20TRA.jpg',
    address: '02 Vũ Văn Dũng, An Hải Tây, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Nhà trưng bày tác phẩm nghệ thuật Sơn Trà được thiết kế lấy cảm hứng từ cánh chim hải âu và tên công trình là Wings Art. Công trình là nơi lưu trữ những giá trị văn hóa truyền thống, tạo điểm đến du lịch , đáp ứng nhu cầu thụ hưởng văn hóa tinh thần của người dân.Điểm nhấn là kiến trúc uốn lượn uyển chuyển, tạo nên nét mềm mại cho tổng thể công trình và đây là một điểm đến thu hút người dân và du khách.',
    lat: 16.05676115957087,
    long: 108.23424655426535,
    reviews: [
      {
        id: 23,
        content: ' Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: ' Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg '
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 26,
        content: ' Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: ' 20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
    ],
    images: [
      'https://docs.portal.danang.gov.vn/images/images/Nam%202024/Thang%2001/22-1%20NHA%20TRUNG%20BAY%20QUAN%20SON%20TRA.jpg',
      'https://image.sggp.org.vn/w2000/Uploaded/2024/evesfnbfjpy/2024_02_03/flycam-5940-6171.jpg',
    ],    
    relatedKeyWord: 'Bao Tang',    
    videos: ['i8EnEF72fa4', '-4pBL_1Qjxw'],
  },  
  {
    id: 32,
    name: 'Cầu Rồng',
    avatar: 'https://tiki.vn/blog/wp-content/uploads/2023/03/cau-rong-da-nang.jpg',
    address: 'An Hải Tây, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Cầu Rồng là một trong những công trình biểu tượng của thành phố Đà Nẵng, nổi bật với kiến trúc độc đáo và mang tính biểu tượng văn hóa đặc trưng của Việt Nam. Đây không chỉ là cây cầu nối liền đôi bờ sông Hàn mà còn là một điểm tham quan nổi tiếng thu hút du khách trong và ngoài nước.',
    lat: 16.061480295569883,
    long: 108.22809214904528,
    reviews: [
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
      {
        id: 9,
        content: 'Amazing!!, I love it !! ',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 7,
        content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '9/10/2024 23:08',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg '
      },
    ],
    images: [
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/1-1658733315-607-width740height312.jpg',
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/2-1658733315-112-width740height515.jpg',
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/3-1658733315-454-width740height515.jpg',
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/4-1658733315-132-width740height515.jpg',
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/5-1658733315-692-width740height493.jpg',
      'https://baogiaothong.mediacdn.vn/upload/3-2022/images/2022-07-25/6-1658733315-468-width740height555.jpeg',
    ],    
    relatedKeyWord: 'Cầu',    
    videos: ['jK9Oe6J3Zdg', 'M5h6eP7zEH0', 'jo6nZmCN0Po'],
  },
  {
    id: 96,
    name: 'Tượng Cá Chép Hóa Rồng',
    avatar: 'https://r2.nucuoimekong.com/wp-content/uploads/ca-chep-hoa-rong.jpg',
    address: 'Đường Trần Hưng Đạo, An Hải, Sơn Trà, Đà Nẵng, Việt Nam ',
    description: 'Tượng cá chép hóa rồng- biểu tượng cho khát khao phồn vinh, nằm trên đường Trần Hưng Đạo, thuộc địa phận quận Sơn Trà, TP. Đà Nẵng. Đây là một điểm du lịch độc đáo, nằm ở phía Đông của sông Hàn và giữa cầu Rồng Đà Nẵng và cầu sông Hàn. Không gian tại đây rất đẹp mắt, bao quát cảnh đẹp toàn thành phố và các dòng sông chảy qua. Đây cũng là một trong những điểm nhấn du lịch tại thành phố Đà Nẵng.',
    lat: 16.063147113685268,
    long: 108.23007248766942,
    reviews: [
      {
        id: 11,
        content: 'quite expensive but worthwhile :P',
        name_user_review: 'William',
        time_review: '13/5/2024 16:30',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/02/25/trend-avatar-6.jpg'
      },
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
    ],
    images: [
      'https://r2.nucuoimekong.com/wp-content/uploads/ca-chep-hoa-rong.jpg',
      'https://www.timdanang.com/tin-tuc/images/dia-diem-du-lich/son-tra/tuong-ca-chep-hoa-rong/tuong-ca-chep-hoa-rong-da-nang-1.jpg',
      'https://static.vinwonders.com/2022/12/tuong-ca-chep-hoa-rong-da-nang-banner.jpg',
      'https://52hz.vn/wp-content/uploads/2022/07/52hz-tuong-ca-chep-hoa-rong.jpg',
    ],    
    relatedKeyWord: 'đà nẵng',    
    videos: ['4JmBIxiZSPI', 'q1BFRI7gqeU'],
  },
  {
    id: 95,
    name: 'Nhà thờ Tiền hiền Làng An Hải và Thoại Ngọc Hầu',
    avatar: 'https://www.baodanang.vn/dataimages/201801/original/images1419970_a4.jpg',
    address: '15 Hà Thị Thân, An Hải Trung, Sơn Trà, Đà Nẵng',
    description: 'Nhà thờ Tiền hiền làng An Hải và Thoại Ngọc Hầu (phường An Hải Tây, quận Sơn Trà) được biết đến không chỉ là ngôi nhà thờ của một làng rộng lớn, có lịch sử lâu đời trên đất Đà Nẵng, mà đây còn là nơi tế tự một nhân vật lịch sử nổi tiếng của quê hương An Hải. Đó là Thoại Ngọc Hầu -  Nguyễn Văn Thoại, một danh tướng lừng lẫy trong Nam ngoài Bắc, được dân Châu Đốc, An Giang tôn kính như một vị thần.',
    lat: 16.059124757446593,
    long: 108.23155058026148,
    reviews: [
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: '黄 贺 江',
        time_review: ' 6/7/2024 7:56',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg '
      },
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
    ],
    images: [
      'https://danangsensetravel.com/view/at_nha-tho-tien-hien-lang-an-hai-va-thoai-ngoc-hau_16b16a1e1431c804f6811ab6d53b66f4.jpg',
      'https://danangfantasticity.com/wp-content/uploads/2018/03/nha-tho-tien-hien-lang-an-hai-va-thoai-ngoc-hau-01.jpg',
      'https://danangfantasticity.com/wp-content/uploads/2018/03/nha-tho-tien-hien-lang-an-hai-va-thoai-ngoc-hau-10.jpg',
    ],    
    relatedKeyWord: 'thờ',    
    videos: ['PCWnp5T7Sgw', 'KUxMehJf0zs'],
  },
  {
    id: 94,
    name: 'Đài Phát thanh - Truyền hình Đà Nẵng',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/4/47/%C4%90%C3%A0i_Ph%C3%A1t_thanh_Truy%E1%BB%81n_h%C3%ACnh_%C4%90%C3%A0_N%E1%BA%B5ng_2.jpeg',
    address: 'Đường Trần Hưng Đạo, An Hải Tây, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Đài Phát thanh - Truyền hình Đà Nẵng được thành lập vào năm 1977, là một trong những đài phát thanh - truyền hình lớn tại khu vực miền Trung. Trụ sở chính của đài DRT nằm tại số 525 Trần Hưng Đạo, quận Sơn Trà, thành phố Đà Nẵng. Đài Phát thanh - Truyền hình Đà Nẵng (DRT) là cơ quan truyền thông lớn tại thành phố Đà Nẵng, đóng vai trò quan trọng trong việc cung cấp thông tin, giải trí và các chương trình văn hóa, giáo dục cho cộng đồng.',
    lat: 16.05733868499543, 
    long: 108.2316332801281,
    reviews: [
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg '
      },
      {
        id: 23,
        content: 'Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: 'Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg'
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 26,
        content: ' Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: ' 20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
    ],
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/4/47/%C4%90%C3%A0i_Ph%C3%A1t_thanh_Truy%E1%BB%81n_h%C3%ACnh_%C4%90%C3%A0_N%E1%BA%B5ng_2.jpeg',
      'https://danangtv.vn/images/shareface.png',
      'https://upload.wikimedia.org/wikipedia/commons/4/47/%C4%90%C3%A0i_Ph%C3%A1t_thanh_Truy%E1%BB%81n_h%C3%ACnh_%C4%90%C3%A0_N%E1%BA%B5ng_2.jpeg',
    ],    
    relatedKeyWord: 'đà nẵng',    
    videos: ['2cWU5TJ-Gmk'],
  },
  {
    id: 93,
    name: 'Cầu Trần Thị Lý',
    avatar: 'https://static.vinwonders.com/production/cau-tran-thi-ly-da-nang-4.jpg',
    address: 'Đường Trần Thị Lý, Hoà Cường, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Cầu Trần Thị Lý được xem như một trong "tứ đại mỹ cầu" của thành phố với kiến trúc độc đáo, hiện đại, tạo nên một bức tranh đẹp mắt và thanh thoát. Ngoài đóng vai trò quan trọng trong hệ thống giao thông của Đà Nẵng, cầu còn là điểm đến hấp dẫn cho du khách tận hưởng không gian sống ảo tuyệt vời và ghi lại những khoảnh khắc đáng nhớ.',
    lat: 16.05039175451945,
    long: 108.22977361094928,
    reviews: [
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 3,
        content: 'Mình thắc mắc tại sao nơi đây vẫn chưa được mệnh danh là thiên đường ẩm thực nhỉ, dường như sơn hào hải vị trên thế gian đều có thể được tìm thấy ở đây ấy',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '1/7/2024  9:28',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg '
      },
    ],
    images: [
      'https://drt.danang.vn/content/images/2024/01/cau-tran-thi-ly-da-nang--4-.jpg',
      'https://static.vinwonders.com/production/cau-tran-thi-ly-da-nang-top.jpg',
      'https://static.vinwonders.com/production/cau-tran-thi-ly-da-nang-1.jpg',
    ],    
    relatedKeyWord: 'cầu',    
    videos: ['xkrQR9Hthys', 'kvj5jLPbL-g'],
  },
  {
    id: 92,
    name: 'Cầu tình yêu',
    avatar: 'https://duthuyendanang.com/wp-content/uploads/2021/09/cau-tinh-yeu-da-nang.jpg',
    address: 'Đ. Trần Hưng Đạo, An Hải, Sơn Trà, Đà Nẵng, Việt Nam',
    description: 'Cầu tình yêu Đà Nẵng tuy không có lịch sử lâu đời hay kiến trúc độc đáo như những cây cầu khác tại Đà thành nhưng mỗi ổ khoá được treo trên cầu này lại là một câu chuyện tình yêu lãng mạn. Nó không chỉ là biểu tượng cho tình yêu, mà còn là một điểm nhấn văn hóa du lịch của Đà Nẵng.',
    lat: 16.063356223863742, 
    long: 108.22996690486535,
    reviews: [
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 16,
        content: 'ベトナムでの本当に興味深い経験',
        name_user_review: ' Tomoka',
        time_review: '15/12/2023 17:38',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-51.jpg '
      },
      {
        id: 18,
        content: ' Cần thêm một vài điểm đột phá để mang lại nhiều trải nghiệm thú vị hơn!!',
        name_user_review: ' Công Mẫn',
        time_review: '3/11/2023',
        start: 3,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-12.jpg'
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
      {
        id: 23,
        content: ' Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: ' Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg '
      },
    ],
    images: [
      'https://duthuyendanang.com/wp-content/uploads/2021/09/cau-tinh-yeu-da-nang-1024x659.jpg',
      'https://cdn.vntrip.vn/cam-nang/wp-content/uploads/2017/09/cau-tinh-yeu-da-nang-khi-ve-dem-1.jpg',
      'https://duthuyendanang.com/wp-content/uploads/2021/09/cau-tinh-yeu-da-nang-e-1024x679.jpg',
    ],    
    relatedKeyWord: 'cầu',    
    videos: ['UVvbjjVQYmI'],
  },

  {
    id: 1,
    name: 'Bảo Tàng Điêu Khắc Chăm Đà Nẵng - Cổ Viện Chàm',
    avatar: 'https://www.tourismdanang.vn/wp-content/uploads/Bao-Tang-Dieu-Khac-Cham.jpg',
    address: 'Số 02 đường 2 Tháng 9, Bình Hiên, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Bảo tàng Điêu khắc Chăm Đà Nẵng là bảo tàng trưng bày hiện vật Chăm quy mô nhất ở Việt Nam, trực thuộc Bảo tàng Đà Nẵng.',
    lat: 16.060393475504064,
    long: 108.22360028952114,
    reviews: [
      {
        id: 2,
        content: 'Mình thích cái cách người dân nơi đây tiếp đón mình thật sự, họ tử tế và vui vẻ lắm.',
        name_user_review: 'Trần Đình Quý',
        time_review: '23/9/2024 8:32',
        start: 5,
        avatar: ' https://cdn.kona-blue.com/upload/kona-blue_com/post/images/2024/09/18/457/avatar-mac-dinh-1.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
    ]
  },
  {
    id: 2,
    name: 'Bảo tàng Đà Nẵng',
    avatar: 'https://ik.imagekit.io/tvlk/blog/2022/12/bao-tang-da-nang-1.jpg?tr=dpr-2,w-675',
    address: '24 Trần Phú, Thạch Thang, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Bảo tàng Đà Nẵng thành lập từ năm 1989, được xây dựng mới tại địa điểm số 24 Trần Phú (phường Thạch Thang, quận Hải Châu)...',
    lat: 16.076672988284216,
    long: 108.22152961094984,
    reviews: [
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: 'Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 16,
        content: 'ベトナムでの本当に興味深い経験',
        name_user_review: 'Tomoka',
        time_review: '15/12/2023 17:38',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-51.jpg '
      },
      {
        id: 18,
        content: ' Cần thêm một vài điểm đột phá để mang lại nhiều trải nghiệm thú vị hơn!!',
        name_user_review: ' Công Mẫn',
        time_review: '3/11/2023',
        start: 3,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-12.jpg'
      },
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
    ]
  },
  {
    id: 8,
    name: 'Chợ Hàn Đà Nẵng',
    avatar: 'https://bizweb.dktcdn.net/100/006/093/files/cho-han-da-nang.jpg?v=1701743273595',
    address: '119 Trần Phú, phường Hải Châu 1, quận Hải Châu, TP. Đà Nẵng, Việt Nam',
    description: 'Chợ Hàn Đà Nẵng là một trong những ngôi chợ truyền thống lâu đời tại Đà Thành và cho tới nay vẫn thu hút đông đảo du khách đến thăm, chụp hình lưu niệm và mua sắm.',
    lat: 16.06837114929403,
    long: 108.22456501835748,
    reviews: [
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg'
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg'
      },
      {
        id: 26,
        content: 'Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: '20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg'
      },
      {
        id: 28,
        content: 'जिस तरह से यहां के लोग मेरा स्वागत करते हैं वह मुझे पसंद है, वे बहुत दयालु और खुशमिजाज हैं।',
        name_user_review: 'Ajay',
        time_review: '24/3/2024 12:49',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-1.jpg'
      },
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: '黄 贺 江',
        time_review: ' 6/7/2024 7:56',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
    ]
  },
  {
    id: 12,
    name: 'Công viên Châu Á - Sun World Asia Park',
    avatar: 'https://cdn3.ivivu.com/2024/01/Asia-Park-ivivu.jpg',
    address: 'Hòa Cường, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Nhắc đến những địa điểm vui chơi hàng đầu Đà Nẵng, chúng ta không thể nào bỏ qua Công Viên Châu Á Đà Nẵng - hay Asia Park Danang. Toạ lạ trên khuôn viên rộng khoảng 800 héc-ta, Công Viên Châu Á Đà Nẵng tái hiện 10 nền văn hoá khác nhau tại Châu Á, mang đến cho bạn những trải nghiệm du lịch và trò chơi đầy cảm xúc. Đó có thể là giây phút “hú hồn” với trò chơi cảm giác mạnh Singapore Sling, thoả thích ngắm cảnh trên tàu điện trên cao hiện đại nhất Việt Nam hay check-in cùng vòng xoay đu quay khổng lồ Sun Wheel.',
    lat: 16.040296195587647,
    long: 108.22659879084512,
    reviews: [
      {
        id: 6,
        content: 'Quả thật là một thành phố hiện đại và đáng sống, cơ sở hạ tầng rất thuận lợi cho di chuyển, tham quan và du lịch',
        name_user_review: 'Nguyễn Ngọc Mai Khanh',
        time_review: ' 6/9/2024 7:30',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-100.jpg '
      },
      {
        id: 7,
        content: 'Thật không hổ danh là thành phố du lịch, tôi dường như có rất nhiều lựa chọn nơi ở, hầu như tất cả đều rất mới mẻ và có dịch vụ tốt',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '9/10/2024 23:08',
        start: 5,
        avatar: ' https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-89.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 9,
        content: 'Amazing!!, I love it !! ',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg '
      },
      {
        id: 10,
        content: 'the atmosphere is insane!!',
        name_user_review: 'David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
    ]
  },
  {
    id: 13,
    name: 'Nhà hát tuồng Nguyễn Hiển Dĩnh',
    avatar: 'https://static.baovanhoa.vn/zoom/1200_630/Portals/0/EasyDNNNews/31584/Show-di%E1%BB%85n-H%E1%BB%93n-Vi%E1%BB%87t-t%E1%BA%A1i-nh%C3%A0-h%C3%A1t-tu%E1%BB%93ng-Nguy%E1%BB%85n-Hi%E1%BB%83n-D%C4%A9nh.jpg',
    address: '155 Phan Châu Trinh, Phước Ninh, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Nhà hát Tuồng Nguyễn Hiển Dĩnh là điểm đến hấp dẫn nhiều khách du lịch, nhất là khách du lịch quốc tế nhờ chương trình biểu diễn nghệ thuật mang đậm sắc thái văn hóa dân gian Việt Nam..',
    lat: 16.064430323083624,
    long: 108.2204454606854,
    reviews: [
      {
        id: 23,
        content: ' Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: ' Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg '
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 26,
        content: ' Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: ' 20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
    ]
  },
  {
    id: 14,
    name: 'Bảo tàng Mỹ Thuật',
    avatar: 'https://yarraoceansuitesdanang.com/wp-content/uploads/2023/05/7.-Bao-tang-My-Thuat-Da-Nang-1-1536x768.jpg',
    address: '78 Lê Duẩn, Thạch Thang, Hải Châu, Đà Nẵng, Việt Nam ',
    description: 'Bảo tàng Mỹ thuật được thành lập vào ngày 29/7/2014, là một trong những bảo tàng Đà Nẵng tiêu biểu, nơi bảo tồn giá trị di sản mỹ thuật của thành phố và các tỉnh khu vực miền Trung – Tây Nguyên.',
    lat: 16.071342327598945,
    long: 108.2184775374053,
    reviews: [
      {
        id: 16,
        content: 'ベトナムでの本当に興味深い経験',
        name_user_review: ' Tomoka',
        time_review: '15/12/2023 17:38',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-51.jpg '
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
      {
        id: 18,
        content: ' Cần thêm một vài điểm đột phá để mang lại nhiều trải nghiệm thú vị hơn!!',
        name_user_review: ' Công Mẫn',
        time_review: '3/11/2023',
        start: 3,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-12.jpg'
      },
      {
        id: 19,
        content: ' Suitable for those who like to travel !!',
        name_user_review: ' Liz',
        time_review: '28/9/2023 17:09',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-11.jpg '
      },
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
    ]
  },
  {
    id: 15,
    name: 'Bảo tàng Hồ Chí Minh',
    avatar: 'https://baotanghochiminh.vn/pic/Service/images/BT%20Quan%20khu%205%20(Large).jpg',
    address: '1 Duy Tân, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Việt Nam ',
    description: 'Bảo tàng Hồ Chí Minh Đà Nẵng chính thức đi vào hoạt động vào ngày 19/5/1977, là nơi trưng bày những kỉ vật về cuộc đời và sự nghiệp cách mạng của Bác Hồ, những vật chứng hào hùng trong cuộc đấu tranh bảo vệ Tổ quốc .',
    lat: 16.04881542371627,
    long: 108.21805306438897,
    reviews: [
      {
        id: 11,
        content: 'quite expensive but worthwhile :P',
        name_user_review: 'William',
        time_review: '13/5/2024 16:30',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/02/25/trend-avatar-6.jpg'
      },
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
    ]
  },
  {
    id: 16,
    name: 'Công viên APEC',
    avatar: 'https://halotravel.vn/wp-content/uploads/2022/02/checkin-tai-cong-vien-apec.jpg',
    address: 'Đường 2 Tháng 9, Bình Hiên, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Công viên Apec được khánh thành vào ngày 10/1/2022, có vị trí đắc địa bên bờ sông Hàn. Thiết kế công trình thể hiện ước muốn có thể đưa Đà Nẵng ngày càng vươn cao, vươn xa, trở thành một thành phố năng động, thân thiện và yên bình.',
    lat: 16.05829106839581,
    long: 108.22362973370124,
    reviews: [
      {
        id: 9,
        content: 'Amazing!!, I love it !! ',
        name_user_review: 'John Peterson',
        time_review: '30/9/2024 11:44',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/17/trend-avatar-1.jpg '
      },
      {
        id: 8,
        content: 'Tôi thật bất ngờ với các hoạt động du lịch tại đây, có rất nhiều hoạt động cho du khách như pháo hoa hay nhạc hội, tất cả đều rất tuyệt vời',
        name_user_review: 'Ngô Châu Bảo Khanh',
        time_review: ' 15/8/2024 17:02',
        start: 5,
        avatar: 'https://cdn-media.sforum.vn/storage/app/media/THANHAN/avatar-trang-96.jpg '
      },
      {
        id: 10,
        content: ' the atmosphere is insane!!',
        name_user_review: ' David',
        time_review: '23/9/2024 5:45',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/20/trend-avatar-12.jpg '
      },
      {
        id: 11,
        content: 'quite expensive but worthwhile :P',
        name_user_review: 'William',
        time_review: '13/5/2024 16:30',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/02/25/trend-avatar-6.jpg'
      },
      {
        id: 12,
        content: ' Mình yêu cái đẹp và cả những dịch vụ tuyệt vời ở đây',
        name_user_review: ' Việt Hà',
        time_review: '21/4/2024 14:43',
        start: 5,
        avatar: ' https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-7.jpg '
      },
    ]
  },
  {
    id: 17,
    name: 'Chùa Nam Sơn',
    avatar: 'https://static.vinwonders.com/2022/04/chua-nam-son-da-nang-3.jpg',
    address: 'Đường Nguyễn Khải Trạc, Cẩm Nam, hòa Châu, Hòa Vang, Đà Nẵng, Việt Nam',
    description: 'Được thành lập vào năm 1962, sở hữu vẻ đẹp uy nghiêm, thanh tịnh nhưng không kém phần thơ mộng, chùa Nam Sơn từ lâu đã không đơn thuần là một điểm đến văn hóa tín ngưỡng của người dân , mà còn trở thành địa danh du lịch hấp dẫn du khách.',
    lat: 15.99882037064043,
    long: 108.20550664719194,
    reviews: [
      {
        id: 14,
        content: '저는 이 도시의 멋진 여행 경험에 정말 매료되었습니다. 특히 모두의 친절함에 감동받았습니다.',
        name_user_review: '전정국',
        time_review: '1/9/2024. 19:42',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/04/trend-avatar-9.jpg '
      },
      {
        id: 16,
        content: 'ベトナムでの本当に興味深い経験',
        name_user_review: ' Tomoka',
        time_review: '15/12/2023 17:38',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-51.jpg '
      },
      {
        id: 18,
        content: ' Cần thêm một vài điểm đột phá để mang lại nhiều trải nghiệm thú vị hơn!!',
        name_user_review: ' Công Mẫn',
        time_review: '3/11/2023',
        start: 3,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-12.jpg'
      },
      {
        id: 17,
        content: ' Nhất định phải mang theo máy ảnh để ghi lại những khoảnh khắc tuyệt vời ở đây nhé !!',
        name_user_review: ' Tấn Minh',
        time_review: '22/4/2024 19:53',
        start: 5,
        avatar: 'https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-11.jpg '
      },
      {
        id: 23,
        content: ' Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: ' Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg '
      },
    ]
  },
  {
    id: 23,
    name: 'Helio Center',
    avatar: 'https://khuvuichoi.com/wp-content/uploads/2019/05/helio-center-da-nang-5.png',
    address: '01 đường 2 Tháng 9, Hoà Cường Bắc, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Helio Center – Tổ hợp vui chơi và chợ đêm lớn nhất Đà Nẵng. Nơi đây đa dạng các hoạt động giải trí khác nhau như khu game trong nhà, khu vui chơi trẻ em, chợ đêm và cụm rạp chiếu phim..',
    lat: 16.036063809581506,
    long: 108.22476456438862,
    reviews: [
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
      {
        id: 15,
        content: ' Rất đáng để thử, chắc chắn sẽ quay lại lần sau!!',
        name_user_review: ' Trần Tín',
        time_review: '24/4/2024 13:02',
        start: 5,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/07/trend-avatar-10.jpg '
      },
      {
        id: 13,
        content: ' Dịch vụ ở đây không quá đắt nhưng thật sự vẫn rất khó tiếp cận với đại đa số khách hàng',
        name_user_review: ' Quang Khánh',
        time_review: '19/1/2024 17:56',
        start: 2,
        avatar: 'https://vnn-imgs-a1.vgcloud.vn/image1.ictnews.vn/_Files/2020/03/21/trend-avatar-13.jpeg.jpg '
      },
      {
        id: 4,
        content: 'chắc chắn mình sẽ quay lại đây nhiều lần nữa, chất lượng thật sự rất tương xứng với giá tiền bỏ ra',
        name_user_review: 'Ngô Bảo Khang',
        time_review: '5/7/2024 16:02',
        start: 5,
        avatar: ' https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-34.jpg '
      },
      {
        id: 3,
        content: 'Mình thắc mắc tại sao nơi đây vẫn chưa được mệnh danh là thiên đường ẩm thực nhỉ, dường như sơn hào hải vị trên thế gian đều có thể được tìm thấy ở đây ấy',
        name_user_review: 'Ngô Ngọc Hoàng Vương',
        time_review: '1/7/2024  9:28',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-nam-nu-trang-2.jpg '
      },
    ]
  },
  {
    id: 27,
    name: 'Nhà thờ chính tòa Đà Nẵng',
    avatar: 'https://statics.vinpearl.com/nha-tho-con-ga-da-nang-01_1632498684.jpg',
    address: '156 Trần Phú, Hải Châu 1, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'Nhà thờ chính tòa hay Nhà thờ Con Gà nằm ngay trung tâm thành phố , thu hút du khách bởi kiến trúc châu Âu cổ kính, độc đáo và vô cùng mới lạ. Nhà thờ Con Gà mang nét đẹp tôn giáo và là điểm đến không thể chối từ dành cho các tín đồ “sống ảo”..',
    lat: 16.066867760389936,
    long: 108.22364684904535,
    reviews: [
      {
        id: 22,
        content: '이곳은 매우 아름답고 명승지가 많고 사람들이 친절하며 가격이 저렴합니다.',
        name_user_review: '김남준',
        time_review: '12/9/2023 21:08',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-8-1.jpg '
      },
      {
        id: 23,
        content: 'Mình đã có những trải nghiệm tuyệt vời cùng gia đình mình !',
        name_user_review: 'Xuân Hiệp',
        time_review: ' 6/9/2024 12:44',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-7-2.jpg'
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 26,
        content: ' Nó có một sự đặc trưng chẳng thể tìm thấy ở đâu khácc O_O',
        name_user_review: ' Gia Khang',
        time_review: ' 20/12/2023 12:04',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-8.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
    ]
  },
  {
    id: 28,
    name: 'Chợ Cồn',
    avatar: 'https://dacsanlamqua.com/wp-content/uploads/2017/01/Anh-cho-con.jpg',
    address: '90 Hùng Vương, Hải Châu 1, Hải Châu, Đà Nẵng, Việt Nam',
    description: 'chợ Cồn tọa lạc tại trung tâm thành phố. Chợ Cồn được đánh giá là sầm uất và lớn nhất Đà Nẵng với tổng diện tích 14.000m2, nơi quy tụ hơn 2.000 sạp hàng, nằm trải đều khắp 3 tầng của ngôi chợ..',
    lat: 16.06788032057777,
    long: 108.21477783184947,
    reviews: [
      {
        id: 29,
        content: '真正的现代化宜居城市，基础设施十分便利，出行、观光、出行十分便利。',
        name_user_review: '黄 贺 江',
        time_review: ' 6/7/2024 7:56',
        start: 5,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-facebook-trang-2-2.jpg '
      },
      {
        id: 27,
        content: `It's really familiar to foreigners like us.Anyway, appreciate!`,
        name_user_review: ' Thomas',
        time_review: '13/8/2023 18:48',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-2.jpg '
      },
      {
        id: 25,
        content: '나는 확실히 여기에 여러 번 돌아올 것입니다. 품질은 가격에 비례합니다.',
        name_user_review: '박지민',
        time_review: '31/10/2023 6:58',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-6.jpg '
      },
      {
        id: 24,
        content: 'Mọi thứ thật tuyệt vời, chỉ là vẫn còn những lỗi nhỏ để có thể trở nên hoàn hảo',
        name_user_review: 'Hoàng Kiên',
        time_review: '13/4/2024',
        start: 4,
        avatar: ' https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/59d24ea49dc6ecd890c9b00f85c4aecb.jpg '
      },
      {
        id: 20,
        content: ' Nhất định phải thử những món ăn tuyệt vời ở đâyyy',
        name_user_review: ' Quốc Huy',
        time_review: '15/2/2024 13:12',
        start: 5,
        avatar: 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/avatar-trang-nu-13.jpg '
      },
    ]
  },
]