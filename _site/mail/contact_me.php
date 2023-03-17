<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

// Get the form data
$name = $_POST['name'];
$email = $_POST['email'];
$phone = $_POST['phone'];
$message = $_POST['message'];

// Create a new PHPMailer instance
$mail = new PHPMailer(true);

try {
    // Configure the PHPMailer instance
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'your-gmail-username@gmail.com';
    $mail->Password = 'your-gmail-password';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;

    // Set the recipient email address
    $mail->addAddress('aguasaneamientoparaperu@gmail.com');

    // Set the email subject and body
    $mail->setFrom($email, $name);
    $mail->Subject = 'New message from ' . $name;
    $mail->Body = "Name: $name\nEmail: $email\nPhone: $phone\n\nMessage:\n$message";

    // Send the email
    $mail->send();

    // Return a success response
    echo 'success';
} catch (Exception $e) {
    // Return an error response
    echo 'error';
}
?>