# Write a program using general exception

try:
    x = int(input("Enter number: "))
    print(10 / x)
except Exception:    
    print("Some error occurred")


#  Output:
# Enter number: 0
# Some error occurred
