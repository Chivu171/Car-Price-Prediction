/**
 * Chờ cho đến khi toàn bộ nội dung của trang được tải xong,
 * sau đó gắn các sự kiện cho các phần tử.
 */
document.addEventListener('DOMContentLoaded', () => {

  // Lấy nút dự đoán từ DOM bằng ID trong file HTML của bạn
  const predictButton = document.getElementById('btnPredict');
  
  // Kiểm tra xem nút có tồn tại không
  if (predictButton) {
      // Gán sự kiện 'click' cho nút dự đoán
      predictButton.addEventListener('click', async () => {
          
          // Lấy các phần tử hiển thị kết quả
          const resultDiv = document.getElementById('predictionResult');

          // --- Vô hiệu hóa nút và hiển thị trạng thái "Loading" ---
          predictButton.disabled = true;
          predictButton.innerText = 'Predicting...';

          // --- 1. Thu thập dữ liệu từ các trường input ---
          // Sửa lại ID để khớp với file HTML của bạn
          const carData = {
              // Key ('name', 'year',...) phải khớp với những gì backend (app.py) mong đợi
              name: document.getElementById('carName').value, // Sửa từ 'name' thành 'carName'
              year: parseInt(document.getElementById('year').value),
              km_driven: parseInt(document.getElementById('km_driven').value),
              fuel: document.getElementById('fuel').value,
              seller_type: document.getElementById('seller_type').value,
              transmission: document.getElementById('transmission').value,
              owner: document.getElementById('owner_Column').value, // Sửa từ 'owner' thành 'owner_Column'
          };

          // Kiểm tra xem người dùng đã nhập đủ thông tin chưa
          if (!carData.name || !carData.year || !carData.km_driven || !carData.fuel || !carData.seller_type || !carData.transmission || !carData.owner) {
              alert('Vui lòng điền đầy đủ tất cả các trường thông tin.');
              // Kích hoạt lại nút
              predictButton.disabled = false;
              predictButton.innerText = 'Predict';
              return; // Dừng việc gửi request
          }


          // --- 2. Gửi dữ liệu đến backend API bằng fetch ---
          try {
              // Hiển thị trạng thái đang dự đoán
              resultDiv.style.display = 'block';
              resultDiv.className = 'alert alert-info text-center'; // Sử dụng class của Bootstrap
              resultDiv.innerText = 'Predicting…';

              // Gửi request đến endpoint /predict trên server Flask
              const response = await fetch('/predict', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(carData),
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
              }
              
              // 3. Nhận kết quả dự đoán từ backend
              const result = await response.json();
              const predictedPriceINR = result.prediction;

              // 4. Quy đổi sang VNĐ (tạm tính tỷ giá 1 INR = 310 VNĐ)
              const exchangeRate = 310;
              const predictedPriceVND = predictedPriceINR * exchangeRate;

              // 5. Hiển thị kết quả lên giao diện
              const formatter = new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  minimumFractionDigits: 0
              });
              
              // Cập nhật kết quả vào div
              resultDiv.className = 'alert alert-success text-center'; // Đổi class để có màu xanh
              resultDiv.innerText  = `Giá xe dự đoán: ${formatter.format(predictedPriceVND)}`;

          } catch (error) {
              // Xử lý lỗi nếu không thể kết nối hoặc có lỗi từ server
              console.error('Lỗi khi gửi yêu cầu:', error);
              resultDiv.className = 'alert alert-danger text-center';
              resultDiv.innerText = 'Lỗi khi dự đoán: ' + error.message;
          } finally {
              // --- Kích hoạt lại nút sau khi hoàn tất ---
              predictButton.disabled = false;
              predictButton.innerText = 'Predict';
          }
      });
  } else {
      console.error("Không tìm thấy nút có ID 'btnPredict'.");
  }
});
