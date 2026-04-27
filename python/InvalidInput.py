# Write a program to handle invalid input

try:
    num = int("abc")
    print(num)
except ValueError:
    print("Invalid input")


# Output:
# Invalid input
