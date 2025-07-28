from flask_cors import CORS
from pymodbus.client import ModbusTcpClient
from time import sleep
import time
from flask import Flask, render_template, request, jsonify
import webbrowser
import os
import threading
import pandas as pd
from datetime import datetime

app = Flask(__name__, static_folder='static')
CORS(app)
webbrowser.open("http:127.0.0.1:5500")

PLC_IP = '192.168.0.190'
PLC_PORT = 502
client = ModbusTcpClient(PLC_IP, port=PLC_PORT)

@app.route('/')
def home():
    return render_template('erp.html')

@app.route('/erp')
def erp():
    return render_template('erp.html')

@app.route('/controller')
def controller():
    return render_template('reportuser.html')

@app.route('/inventory')
def inventory():
    return render_template('inventoryuser.html')

@app.route('/digitaltwin')
def digitaltwin():
    return render_template('digitaltwin.html')

@app.route('/userlogin')
def userlogin():
    return render_template('userlogin.html')

@app.route('/logout')
def logout():
    return render_template('erp.html')

# API Endpoint for JavaScript to fetch data from Flask
@app.route('/api/data')
def get_data():
    return jsonify({"message": "Hello from Flask!"})

@app.route('/checkstatusConnect', methods=['POST'])
def checkstatusConnect():
    try:
        # Attempt to connect to the PLC
        connection = client.connect()  # Connect to the PLC

        # Check if the connection was successful
        if connection:  # Assuming 'client.connect()' returns True if connected successfully
            return jsonify({"Status": 1})  # Successfully connected
        else:
            return jsonify({"Status": 0, "error": "PLC connection failed"}), 500  # Failed connection
    except Exception as e:
        # Handle any exceptions (e.g., connection errors)
        return jsonify({"Status": 0, "error": str(e)}), 500  # Return error if connection fails


@app.route('/checkstatusYO', methods=['POST'])
def checkstatusYO():
    try:
        if client.connect():
            y0 = client.read_coils(40960, count=1).bits[0]  # Read coil Y0
            return jsonify({"Y0": int(y0)})  # Ensure response is in JSON format
        else:
            return jsonify({'error': 'PLC connection failed'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500  # Handle connection or read errors


@app.route('/TurnOnSystem', methods=['POST'])
def TurnOnSystem():
    print("Received request at /TurnOnSystem")  # Debugging

    if client.connect():
        print("PLC Connected Successfully")  # Debugging

        client.write_coil(0, True)
        sleep(1)
        client.write_coil(0, False)

        return jsonify({'success': 'System turned off'}), 200

    print("PLC Connection Failed")  # Debugging
    return jsonify({'error': 'PLC connection failed'}), 500



@app.route('/TurnoffSystem', methods=['POST'])
def TurnoffSystem():
    print("Received request at /TurnOnSystem")  # Debugging

    if client.connect():
        print("PLC Connected Successfully")  # Debugging

        client.write_coil(1, True)
        sleep(1)
        client.write_coil(1, False)

        return jsonify({'success': 'System turned on'}), 200

    print("PLC Connection Failed")  # Debugging
    return jsonify({'error': 'PLC connection failed'}), 500


@app.route('/read_plc_coil', methods=['GET'])
def read_plc_coil():
    if client.connect():
        m20 = client.read_coils(20, count=1).bits[0]
        m21 = client.read_coils(21, count=1).bits[0]
        # m22 = client.read_coils(22, count=1).bits[0]
        D1 = client.read_holding_registers(1, count=1)
        D2 = client.read_holding_registers(2, count=1)
        # D3 = client.read_holding_registers(3, count=1)

        order_placed = m20 or m21   # True if any coil is active
        D1span = D1.registers[0]
        D2span = D2.registers[0]
        # D3span = D3.registers[0]

        return jsonify({
            'orderPlaced': order_placed,
            'D1span': D1span,
            'D2span': D2span,
            # 'D3span': D3span
        })  # Send response

    return jsonify({'error': 'PLC connection failed'}), 500

@app.route('/write_to_plc', methods=['POST'])
def write_to_plc():
    data = request.json
    product_a = int(data.get('ProductA', 0))
    product_b = int(data.get('ProductB', 0))
    # product_c = int(data.get('ProductC', 0))
    y0 = client.read_coils(40960, count=1).bits[0]

    if client.connect() and y0:
        client.write_register(1, product_a)
        client.write_register(2, product_b)
        # client.write_register(3, product_c)

        time.sleep(3)

        # Read registers properly
        D1 = client.read_holding_registers(1, count=1)
        D2 = client.read_holding_registers(2, count=1)
        # D3 = client.read_holding_registers(3, count=1)

        # Extract values safely
        D1_value = D1.registers[0] if D1 else 0
        D2_value = D2.registers[0] if D2 else 0
        # D3_value = D3.registers[0] if D3 else 0

        client.write_coil(35,True)
        sleep(.5)
        client.write_coil(35,False)

        def wait_for_m_off(m_address):
            """Waits until the given memory bit turns off."""
            while client.read_coils(m_address, count=1).bits[0]:
                time.sleep(0.5)  # Poll every 0.5 seconds

        if D1_value > 0:
            client.write_coil(3, True)
            time.sleep(.5)
            client.write_coil(3, False)
            wait_for_m_off(20)  # Wait for m20 to turn off

        if D2_value > 0:
            client.write_coil(4, True)
            time.sleep(.5)
            client.write_coil(4, False)
            wait_for_m_off(21)  # Wait for m21 to turn off

        # if D3_value > 0:
        #     client.write_coil(5, True)
        #     time.sleep(.5)
        #     client.write_coil(5, False)
        #     wait_for_m_off(22)  # Wait for m22 to turn off
        client.close()
        return jsonify({"message": "Values written to PLC and coils updated", "status": "success"})

    else:
        return jsonify({"message": "Failed to connect to PLC", "status": "error"}), 500

@app.route('/cancel_order', methods=['POST'])
def cancel_order():
    client.write_coil(30, True)
    client.write_coil(20, False)
    client.write_coil(21, False)
    client.write_coil(22, False)
    client.write_register(1, 0)
    client.write_register(2, 0)
    client.write_register(3, 0)
    client.write_coil(32,True)
    sleep(3)
    client.write_coil(30, False)
    client.write_coil(32,False)




    return jsonify({"message": "Order Canceled"}), 200

@app.route('/underprocess_read', methods=['POST'])
def underprocess_read():
    if not client.connect():  # Ensure the connection is established first
        return jsonify({'error': 'PLC connection failed'}), 500

    try:
        y0 = client.read_coils(40960, count=1).bits[0]  # Read coil
        if y0:
            D10 = client.read_holding_registers(10, count=1).registers[0]
            D11 = client.read_holding_registers(11, count=1).registers[0]
            # D12 = client.read_holding_registers(12, count=1).registers[0]

            return jsonify({
                'D10': D10,
                'D11': D11,
                # 'D12': D12
            })
        else:
            return jsonify({'error': 'Y0 is off, no process running'}), 400  # Bad request if Y0 is off

    except Exception as e:
        return jsonify({'error': f'Error reading PLC data: {str(e)}'}), 500  # Handle errors properly


@app.route('/productinStorage', methods=['POST'])
def productinStorage():
    if not client.connect():  # Ensure the connection is established first
        return jsonify({'error': 'PLC connection failed'}), 500
    try:
        C1D7 = client.read_holding_registers(7, count=1).registers[0]
        C4D8 = client.read_holding_registers(8, count=1).registers[0]
        # C6D9 = client.read_holding_registers(9, count=1).registers[0]
        return jsonify({
            'C1D7': C1D7,
            'C4D8': C4D8,
            # 'C6D9': C6D9
        })
    except Exception as e:
        return jsonify({'error': f'Error reading PLC data: {str(e)}'}), 500

    
@app.route('/plc/sensor-status', methods=['POST'])
def sensor_status():
    print("Sensor status API called")  # DEBUG LINE

    if not client.connect():
        return jsonify({'error': 'PLC connection failed'}), 500

    try:
        coils = client.read_coils(81, count=10)
        print("Coils read:", coils.bits)  # DEBUG LINE

        if not coils or not coils.bits:
            return jsonify({'error': 'Failed to read sensors'}), 500

        return jsonify({f"M{i+81}": int(bit) for i, bit in enumerate(coils.bits[:10])})

    except Exception as e:
        print("Error:", str(e))  # DEBUG LINE
        return jsonify({'error': f'Error reading sensors: {str(e)}'}), 500
    

#----------------------------------------BackUps--------------------------------------------#
log_file = "product_log.xlsx"
previous_C1D7 = None
previous_C4D8 = None
startup_checked = False


def restore_storage_on_start():
    global startup_checked
    while not startup_checked:
        try:
            if not client.connect():
                print("Waiting for PLC connection...")
                time.sleep(5)
                continue

            # Read D7 and D8 regardless of Y0 status
            C1D7 = client.read_holding_registers(7, count=1).registers[0]
            C4D8 = client.read_holding_registers(8, count=1).registers[0]

            print(f"Startup Read: D7={C1D7}, D8={C4D8}")

            if C1D7 == 0 or C4D8 == 0:
                print("Detected zero in D7 or D8. Attempting restore...")
                try:
                    df = pd.read_excel(log_file)
                    last_row = df.iloc[-1]
                    restored_C1D7 = int(last_row["Item 1"])
                    restored_C4D8 = int(last_row["Item 2"])

                    if C1D7 == 0:
                        client.write_register(21, restored_C1D7)
                        print(f"Wrote {restored_C1D7} to D21")

                    if C4D8 == 0:
                        client.write_register(22, restored_C4D8)
                        print(f"Wrote {restored_C4D8} to D22")

                    # Toggle M24 (coil 24)
                    client.write_coil(24, True)
                    print("M24 ON")
                    time.sleep(2)
                    client.write_coil(24, False)
                    print("M24 OFF")

                except Exception as e:
                    print(f"Restore failed: {e}")
            else:
                print("D7/D8 already non-zero, skipping restore.")

            startup_checked = True
        except Exception as e:
            print(f"Error in startup restore: {e}")
            time.sleep(5)

def monitor_and_log_products():
    global previous_C1D7, previous_C4D8
    has_initialized = False  # new flag

    while True:
        try:
            if not client.connect():
                print("PLC not connected, retrying...")
                time.sleep(20)
                continue

            y0 = client.read_coils(40960, count=1).bits[0]
            if not y0:
                print("Y0 OFF — skipping log.")
                time.sleep(20)
                continue

            C1D7 = client.read_holding_registers(7, count=1).registers[0]
            C4D8 = client.read_holding_registers(8, count=1).registers[0]

            # Skip if both are 0 — this prevents accidental log after power loss
            if C1D7 == 0 and C4D8 == 0:
                print("Both D7 and D8 are zero — skipping log.")
                time.sleep(20)
                continue

            # Only proceed after we have at least one valid starting point
            if not has_initialized:
                previous_C1D7 = C1D7
                previous_C4D8 = C4D8
                has_initialized = True
                print("Initialized logger with first valid values.")
                continue

            if C1D7 != previous_C1D7 or C4D8 != previous_C4D8:
                now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                data = {
                    "Item 1": [C1D7],
                    "Time 1": [now],
                    "Item 2": [C4D8],
                    "Time 2": [now]
                }

                try:
                    df_existing = pd.read_excel(log_file)
                    df_new = pd.DataFrame(data)
                    df_combined = pd.concat([df_existing, df_new], ignore_index=True)
                except FileNotFoundError:
                    df_combined = pd.DataFrame(data)

                df_combined.to_excel(log_file, index=False)
                print(f"✅ Logged: D7={C1D7}, D8={C4D8} at {now}")

                previous_C1D7 = C1D7
                previous_C4D8 = C4D8
            else:
                print("No change — skipped logging.")

        except Exception as e:
            print(f"Logging error: {e}")

        time.sleep(20)


# Start both threads
threading.Thread(target=restore_storage_on_start, daemon=True).start()
threading.Thread(target=monitor_and_log_products, daemon=True).start()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5500, debug=True)
