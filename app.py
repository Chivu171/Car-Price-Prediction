import joblib
import pandas as pd
import numpy as np
import json 

from flask import Flask,request,jsonify,render_template


# --- 2. KHỞI TẠO ỨNG DỤNG FLASK ---
app  =Flask(__name__)

# --- 3. TẢI MÔ HÌNH VÀ CÁC THÀNH PHẦN ĐÃ LƯU ---
try:
    # Tải mô hình đã được huấn luyện (bạn đã lưu mô hình RandomForest)
    model = joblib.load('car_price_model.pkl')

    # Tải danh sách các cột mà mô hình đã học
    with open ('model_columns.json', 'r') as f:
        model_columns = json.load(f)
    print("Đã tải mô hình và các cột thành công")

except FileNotFoundError:
        print(">>> Lỗi: Không tìm thấy file 'car_price_model.pkl' hoặc 'model_columns.json'.")
        print(">>> Vui lòng chạy lại notebook để tạo các file này và đặt chúng vào cùng thư mục với app.py")
        model= None
        model_columns =None

# --- 4. ĐỊNH NGHĨA ROUTE CHO TRANG CHỦ ---
@app.route('/')  # Mặc định là methods=['GET']
def home():
     return render_template('index.html')

# --- 5. ĐỊNH NGHĨA ROUTE API ĐỂ DỰ ĐOÁN ---

@app.route('/predict', methods=['POST'])
def predict():
    # ktra xem model va model_columns da co du lieu chua
    if model is None or model_columns is None:
        return jsonify({'error': 'Mô hình chưa được tải, vui lòng kiểm tra lại server.'}), 500
    
    try:
        # Lấy dữ liệu dạng JSON được gửi từ frontend
        data = request.get_json(force=True)
        print(">>> Dữ liệu nhận được:", data)
        # Chuyển dữ liệu JSON thành một DataFrame của pandas (có 1 hàng)
        new_car_df = pd.DataFrame([data]) 
        
        # --- ÁP DỤNG CÁC BƯỚC TIỀN XỬ LÝ (FEATURE ENGINEERING) Y HỆT TRONG NOTEBOOK ---
        currentYear = 2025 # Phải giống hệt giá trị bạn dùng khi huấn luyện
        new_car_df['age'] = currentYear - new_car_df['year']
        # Dùng log1p để nhất quán với notebook
        new_car_df['km_driven'] = np.log1p(new_car_df['km_driven'])

        # c. Trích xuất 'brand' từ cột 'name'
        new_car_df['brand'] = new_car_df['name'].apply(lambda x: x.split(' ')[0])
        
        # d. One-Hot Encoding
        new_car_df = pd.get_dummies(new_car_df, columns=['fuel', 'seller_type', 'transmission', 'owner', 'brand'], drop_first=True)

        # e. Đồng bộ hóa các cột để khớp với dữ liệu huấn luyện
        new_car_processed_df = new_car_df.reindex(columns=model_columns, fill_value=0)

        # --- 6. ĐƯA RA DỰ ĐOÁN ---
        log_prediction = model.predict(new_car_processed_df)
        actual_prediction = np.expm1(log_prediction)
        output = actual_prediction[0]
        print(f">>> Giá dự đoán (INR): {output}")
        
        # --- 7. TRẢ KẾT QUẢ VỀ CHO FRONTEND ---
        return jsonify({'prediction': output})

    except Exception as e:
        print(f">>> Lỗi khi xử lý: {e}")
        return jsonify({'error': str(e)}), 400

# --- 8. CHẠY SERVER ---

if __name__ == '__main__':
      app.run(port=5000, debug=True)




        




