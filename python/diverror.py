#Write a program to handle division error

try:
    a = int(input("Enter number:"))
    result = 10/a
    print("Result:", result)
except ZeroDivisionError:
    print("Cannot divide by zero")
except ValueError:
    print("Invalid input")

# Output:
# Enter number: 0
# Cannot divide by zero
