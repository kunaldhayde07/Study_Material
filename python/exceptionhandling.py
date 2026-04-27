# To write a Python program demonstrating exception handling for an ATM withdrawal system.

# ATM Withdrawal Program
# Taking valid balance input

# Taking valid account balance
while True:
    try:
        balance = int(input("Enter current account balance: "))
        if balance < 0:
            raise ValueError
        break
    except ValueError:
        print("Invalid input! Balance must be a non-negative number.")

# Taking valid withdrawal amount
while True:
    try:
        amount = int(input("Enter withdrawal amount: "))
        if amount <= 0:
            raise ValueError
        break
    except ValueError:
        print("Invalid input! Amount must be greater than zero.")

# Transaction check
try:
    if amount > balance:
        raise Exception("Insufficient balance")

except Exception as e:
    print("Transaction Error:", e)

else:
    balance -= amount
    print("Withdrawal successful!")
    print("Remaining balance:", balance)

finally:
    print("Thank you for using the ATM.")